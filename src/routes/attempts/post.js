import { json } from '../../lib/json.js';

export async function handleAttemptsPost(request, env) {
	if (!env.DB) {
		return json({ ok: false, error: 'db_binding_missing' }, 500);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_json' }, 400);
	}

	const required = {
		client: ['id', 'name'],
		property: ['id', 'name'],
		flat: [
			'attemptId',
			'pageUrl',
			'validatedEventName',
			'validationResult',
			'timestamp',
			'date',
			'session',
			'browserName',
			'browserVersion',
		],
	};

	const missing = [];

	if (!body.client) {
		missing.push('client');
	} else {
		required.client.forEach((k) => {
			if (body.client[k] === undefined) missing.push(`client.${k}`);
		});
	}

	if (!body.property) {
		missing.push('property');
	} else {
		required.property.forEach((k) => {
			if (body.property[k] === undefined) missing.push(`property.${k}`);
		});
	}

	required.flat.forEach((k) => {
		if (body?.[k] === undefined) missing.push(k);
	});

	if (missing.length) {
		return json({ ok: false, error: 'missing_fields', missing }, 400);
	}

	if (body.validationResult !== 'success' && body.validationResult !== 'failure') {
		return json(
			{
				ok: false,
				error: 'invalid_validation_result',
				expected: ['success', 'failure'],
			},
			400
		);
	}

	if (body.client.id !== env.CLIENT_ID || body.client.name !== env.CLIENT_NAME) {
		return json(
			{
				ok: false,
				error: 'client_mismatch',
			},
			400
		);
	}

	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	try {
		await env.DB.prepare(
			`
      INSERT INTO validation_attempts (
        id,
        attempt_id,
        created_at,
        client_id,
        client_name,
        property_id,
        property_name,
        session_id,
        page_url,
        validated_event_name,
        validation_result,
        event_timestamp,
        event_date,
        browser_name,
        browser_version,
        validation_duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(attempt_id) DO UPDATE SET
        validation_result=excluded.validation_result,
        event_timestamp=excluded.event_timestamp,
        event_date=excluded.event_date
    `
		)
			.bind(
				id,
				body.attemptId,
				createdAt,
				body.client.id,
				body.client.name,
				body.property.id,
				body.property.name,
				body.session,
				body.pageUrl,
				body.validatedEventName,
				body.validationResult,
				body.timestamp,
				body.date,
				body.browserName,
				body.browserVersion,
				body.validationDurationMs ?? null
			)
			.run();
	} catch (err) {
		return json(
			{
				ok: false,
				error: 'db_insert_failed',
				message: err?.message || String(err),
			},
			500
		);
	}

	return json(
		{
			ok: true,
			attemptId: body.attemptId,
			validationResult: body.validationResult,
		},
		201
	);
}

import { json } from '../../lib/json.js';

export async function handleIssuesPost(request, env) {
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
		flat: [
			'attemptId',
			'clientId',
			'propertyId',
			'session',
			'validatedEventName',
			'issueType',
			'keyName',
			'timestamp',
			'date',
		],
	};

	const missing = [];

	required.flat.forEach((k) => {
		if (body?.[k] === undefined) missing.push(k);
	});

	if (missing.length) {
		return json({ ok: false, error: 'missing_fields', missing }, 400);
	}

	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	try {
		await env.DB.prepare(
			`
      INSERT INTO validation_issues (
        id,
        attempt_id,
        created_at,
        client_id,
        property_id,
        session_id,
        validated_event_name,
        issue_type,
        key_name,
        event_timestamp,
        event_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
		)
			.bind(
				id,
				body.attemptId,
				createdAt,
				body.clientId,
				body.propertyId,
				body.session,
				body.validatedEventName,
				body.issueType,
				body.keyName,
				body.timestamp,
				body.date
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
			issueId: id,
			attemptId: body.attemptId,
		},
		201
	);
}

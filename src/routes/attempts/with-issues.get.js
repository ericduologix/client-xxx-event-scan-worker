import { json } from '../../lib/json.js';

export async function handleAttemptsWithIssuesGet(request, env) {
	if (!env.DB) {
		return json({ ok: false, error: 'db_binding_missing' }, 500);
	}

	const url = new URL(request.url);
	const propertyId = url.searchParams.get('propertyId');
	const date = url.searchParams.get('date');

	const filters = [];
	const bindings = [];

	if (propertyId) {
		filters.push('a.property_id = ?');
		bindings.push(propertyId);
	}

	if (date) {
		filters.push('a.event_date = ?');
		bindings.push(date);
	}

	const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

	try {
		const rows = await env.DB.prepare(
			`
      SELECT
        a.attempt_id,
        a.validation_result,
        a.property_id,
        a.validated_event_name,
        a.event_timestamp,
        i.id AS issue_id,
        i.issue_type,
        i.key_name
      FROM validation_attempts a
      LEFT JOIN validation_issues i
        ON a.attempt_id = i.attempt_id
      ${whereClause}
      ORDER BY a.event_timestamp DESC
      LIMIT 200
    `
		)
			.bind(...bindings)
			.all();

		// Group issues by attempt
		const map = {};

		for (const row of rows.results) {
			if (!map[row.attempt_id]) {
				map[row.attempt_id] = {
					attemptId: row.attempt_id,
					validationResult: row.validation_result,
					propertyId: row.property_id,
					validatedEventName: row.validated_event_name,
					eventTimestamp: row.event_timestamp,
					issues: [],
				};
			}

			if (row.issue_id) {
				map[row.attempt_id].issues.push({
					issueId: row.issue_id,
					issueType: row.issue_type,
					keyName: row.key_name,
				});
			}
		}

		return json({
			ok: true,
			count: Object.keys(map).length,
			attempts: Object.values(map),
		});
	} catch (err) {
		return json(
			{
				ok: false,
				error: 'db_query_failed',
				message: err?.message || String(err),
			},
			500
		);
	}
}

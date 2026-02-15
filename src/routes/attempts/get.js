import { json } from '../../lib/json.js';

export async function handleAttemptsGet(request, env) {
	if (!env.DB) {
		return json({ ok: false, error: 'db_binding_missing' }, 500);
	}

	const url = new URL(request.url);
	const propertyId = url.searchParams.get('propertyId');
	const date = url.searchParams.get('date');

	const filters = [];
	const bindings = [];

	if (propertyId) {
		filters.push('property_id = ?');
		bindings.push(propertyId);
	}

	if (date) {
		filters.push('event_date = ?');
		bindings.push(date);
	}

	const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

	try {
		const summaryStmt = env.DB.prepare(
			`
      SELECT
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN validation_result = 'success' THEN 1 ELSE 0 END) AS total_successes,
        SUM(CASE WHEN validation_result = 'failure' THEN 1 ELSE 0 END) AS total_failures
      FROM validation_attempts
      ${whereClause}
    `
		).bind(...bindings);

		const summary = await summaryStmt.first();

		const successRate =
			summary.total_attempts > 0 ? summary.total_successes / summary.total_attempts : 0;

		return json({
			ok: true,
			filters: { propertyId, date },
			summary: {
				totalAttempts: summary.total_attempts,
				totalSuccesses: summary.total_successes,
				totalFailures: summary.total_failures,
				successRate,
			},
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

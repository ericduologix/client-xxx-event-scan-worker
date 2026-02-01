import { json } from '../../lib/json.js';

function toInt(value, fallback) {
	const n = Number.parseInt(value ?? '', 10);
	return Number.isFinite(n) ? n : fallback;
}

export async function handleLogGet(request, env) {
	const url = new URL(request.url);

	const propertyId = url.searchParams.get('propertyId');
	const date = url.searchParams.get('date'); // expected: YYYY-MM-DD (optional)
	const session = url.searchParams.get('session'); // optional
	const limit = Math.min(Math.max(toInt(url.searchParams.get('limit'), 50), 1), 200);
	const cursor = url.searchParams.get('cursor'); // optional opaque cursor (we'll use last id)

	const missing = [];
	if (!propertyId) missing.push('propertyId');

	if (missing.length) {
		return json(
			{
				ok: false,
				error: 'missing_query_params',
				missing,
			},
			400
		);
	}

	// Build WHERE clause safely
	// Assumed columns (adjust if needed):
	// - property_id (TEXT)
	// - session_id (TEXT)
	// - date (TEXT 'YYYY-MM-DD') OR derived from timestamp (see note below)
	// - id (TEXT) primary key
	// - timestamp (TEXT ISO) OR created_at, etc.
	const where = [];
	const params = [];

	where.push(`property_id = ?`);
	params.push(propertyId);

	if (date) {
		// If your table stores a 'date' column (YYYY-MM-DD), this is best.
		// If not, see the note below for filtering by timestamp.
		where.push(`date = ?`);
		params.push(date);
	}

	if (session) {
		where.push(`session_id = ?`);
		params.push(session);
	}

	if (cursor) {
		// simple keyset pagination (assumes ids are sortable; if not, paginate by timestamp + id)
		where.push(`id < ?`);
		params.push(cursor);
	}

	const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

	const sql = `
    SELECT
      id,
      timestamp,
      date,
      session_id,
      property_id,
      page_url,
      event_name,
      key_name,
      issue_type,
      browser_name,
      browser_version
    FROM logs
    ${whereSql}
    ORDER BY id DESC
    LIMIT ?
  `;

	const rows = await env.DB.prepare(sql)
		.bind(...params, limit + 1) // fetch one extra to know if there is a next page
		.all();

	const results = rows.results ?? [];
	const hasNext = results.length > limit;
	const items = hasNext ? results.slice(0, limit) : results;

	const nextCursor = hasNext ? items[items.length - 1].id : null;

	return json({
		ok: true,
		client: {
			id: env.CLIENT_ID,
			name: env.CLIENT_NAME,
		},
		query: {
			propertyId,
			date: date ?? null,
			session: session ?? null,
			limit,
			cursor: cursor ?? null,
		},
		count: items.length,
		nextCursor,
		items,
		ts: new Date().toISOString(),
	});
}

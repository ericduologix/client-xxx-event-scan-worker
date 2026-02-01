import { json } from '../../lib/json.js';
import { appVersion } from '../../lib/appVersion.js';

export async function handleMetaGet(request, env) {
	return json({
		ok: true,
		client: {
			id: env.CLIENT_ID,
			name: env.CLIENT_NAME,
		},
		appVersion: {
			version: appVersion.version,
			timestamp: appVersion.timestamp,
		},
		ts: new Date().toISOString(),
	});
}

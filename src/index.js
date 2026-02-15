import { handleAttemptsPost } from './routes/attempts/post.js';
import { handleAttemptsGet } from './routes/attempts/get.js';
import { handleAttemptsWithIssuesGet } from './routes/attempts/with-issues.get.js';
import { handleIssuesPost } from './routes/issues/post.js';
import { handleMetaGet } from './routes/meta/get.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const { pathname } = url;

		// ----------------------------
		// Attempts
		// ----------------------------

		if (request.method === 'POST' && pathname === '/attempts') {
			return handleAttemptsPost(request, env);
		}

		if (request.method === 'GET' && pathname === '/attempts') {
			return handleAttemptsGet(request, env);
		}

		if (request.method === 'GET' && pathname === '/attempts-with-issues') {
			return handleAttemptsWithIssuesGet(request, env);
		}

		// ----------------------------
		// Issues
		// ----------------------------

		if (request.method === 'POST' && pathname === '/issues') {
			return handleIssuesPost(request, env);
		}

		// ----------------------------
		// Meta
		// ----------------------------

		if (request.method === 'GET' && pathname === '/meta') {
			return handleMetaGet(request, env);
		}

		return new Response('Not Found', { status: 404 });
	},
};

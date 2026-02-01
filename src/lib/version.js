export const appVersion = {
	version: '1.0.13',
	timestamp: '2025-08-05T18:45:20Z',
};

// Browser-only: keep your existing global
if (typeof window !== 'undefined') {
	window.appVersion = appVersion;
}

export const appVersion = {
	version: '1.0.14',
	timestamp: '2026-02-01T05:28:48.380Z ',
};

// Browser-only: keep your existing global
if (typeof window !== 'undefined') {
	window.appVersion = appVersion;
}

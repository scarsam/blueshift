export const onRequest: PagesFunction = async ({ request }) => {
	const url = new URL(request.url);
	const path = url.pathname.replace(/^\/agents/, "");
	const proxyUrl = `https://blueshift-invoice-processor.s-ojling.workers.dev${path}${url.search}`;

	// Handle WebSocket upgrade
	if (request.headers.get("upgrade") === "websocket") {
		const wsRequest = new Request(proxyUrl, request);
		const response = await fetch(wsRequest);
		return response;
	}

	// Proxy HTTP request
	const proxyRequest = new Request(proxyUrl, request);
	const response = await fetch(proxyRequest);
	return response;
};

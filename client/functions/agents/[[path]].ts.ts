export const onRequest: PagesFunction = async ({ request }) => {
	const url = new URL(request.url);
	const path = url.pathname.replace(/^\/agents/, "");
	const proxyUrl = `https://blueshift-invoice-processor.s-ojling.workers.dev${path}${url.search}`;

	if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
		// Create a client/server WebSocket pair
		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		// Establish outbound WebSocket connection
		const upstreamResp = await fetch(proxyUrl, {
			headers: request.headers,
			method: "GET",
		});

		if (!upstreamResp.webSocket) {
			return new Response("Upstream failed to return a WebSocket", {
				status: 502,
			});
		}

		// Pipe messages between the client and upstream WebSocket
		// Accept both ends
		server.accept();
		upstreamResp.webSocket.accept();

		// Pipe messages both ways
		server.addEventListener("message", (event) => {
			upstreamResp.webSocket!.send(event.data);
		});
		upstreamResp.webSocket.addEventListener("message", (event) => {
			server.send(event.data);
		});

		// Handle close
		const close = () => {
			try {
				server.close();
			} catch {}
			try {
				upstreamResp.webSocket!.close();
			} catch {}
		};
		server.addEventListener("close", close);
		upstreamResp.webSocket.addEventListener("close", close);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	// Fallback to HTTP proxy
	const proxyRequest = new Request(proxyUrl, request);
	const response = await fetch(proxyRequest);
	return response;
};

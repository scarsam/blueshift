import { Hono, type Context } from "hono";
import { agentsMiddleware } from "hono-agents";
import { cors } from "hono/cors";

export { InvoiceAgent } from "./agents/invoice-agent";

type Bindings = { Bindings: Env };

const app = new Hono<Bindings>();

app.use("*", cors());
app.use("*", agentsMiddleware());

const getAgent = async (c: Context<Bindings>, instanceId: string) => {
	const id = c.env.INVOICE_AGENT.idFromName(instanceId);
	return await c.env.INVOICE_AGENT.get(id);
};

app.post("/api/upload", async (c) => {
	const formData = await c.req.formData();
	const file = formData.get("file") as File;
	const instanceId = formData.get("instanceId") as string;

	if (!file?.type.startsWith("image/")) {
		return c.json({ error: "Invalid file" }, 400);
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const agent = await getAgent(c, instanceId);
	return await agent.parseInvoice({ image: bytes });
});

app.get("/api/vouchers", async (c) => {
	const instanceId = c.req.query("instanceId") || "default";
	const agent = await getAgent(c, instanceId);
	return await agent.getVouchers();
});

app.get("/api/vouchers/:id", async (c) => {
	const instanceId = c.req.query("instanceId") || "default";
	const agent = await getAgent(c, instanceId);
	return await agent.getVoucher(c.req.param("id"));
});

app.delete("/api/vouchers/:id", async (c) => {
	const instanceId = c.req.query("instanceId") || "default";
	const agent = await getAgent(c, instanceId);
	return await agent.deleteVoucher(c.req.param("id"));
});

export default app;

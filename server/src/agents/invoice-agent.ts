import { Agent, type Connection, type WSMessage } from "agents";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAiGateway } from "ai-gateway-provider";
import {
	InvoiceApiSchema,
	VoucherSchema,
	generateVoucherId,
	type InvoiceApi,
	type Voucher,
} from "shared";

interface State {
	correctedInvoice?: InvoiceApi;
	processingStatus?: "idle" | "parsing" | "generating";
	vouchers: Record<string, Voucher>;
}

export class InvoiceAgent extends Agent<Env, State> {
	initialState: State = {
		processingStatus: "idle",
		vouchers: {},
	};

	private async getModel() {
		const gateway = createAiGateway({
			binding: this.env.AI.gateway("blueshift"),
			options: { skipCache: true },
		});

		const apiKey = process.env.OPENAI_API_KEY || this.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY environment variable not set");
		}

		const openai = createOpenAI({ apiKey });
		return gateway([openai("gpt-4o")]);
	}

	private async getAccountingGuidance(invoice: InvoiceApi): Promise<string> {
		try {
			const itemDescriptions = invoice.items
				.map((item) => item.description)
				.join(", ");
			const query = `How should I create journal entries for an invoice from ${invoice.vendorName} for ${itemDescriptions} totaling $${invoice.total}? What accounts should be debited and credited according to US GAAP? Include account codes and ASC references.`;

			const answer = await this.env.AI.autorag("blueshift-rag").aiSearch({
				query,
				rewrite_query: true,
				max_num_results: 3,
				ranking_options: { score_threshold: 0.3 },
				stream: false,
			});

			return JSON.stringify({ answer: answer.data });
		} catch (error) {
			console.error("Error getting accounting guidance:", error);
			return "Use standard expense and accounts payable entries with proper account codes.";
		}
	}

	async getVouchers(): Promise<Response> {
		try {
			if (!this.state.vouchers) {
				this.setState({ ...this.state, vouchers: {} });
				return Response.json({ success: true, vouchers: [] });
			}

			const vouchers = Object.values(this.state.vouchers);
			return Response.json({ success: true, vouchers });
		} catch (error) {
			console.error("Failed to get vouchers:", error);
			return Response.json(
				{
					error: "Failed to get vouchers",
					details: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 },
			);
		}
	}

	async getVoucher(voucherId: string): Promise<Response> {
		try {
			if (!this.state.vouchers) {
				return Response.json({ error: "No vouchers found" }, { status: 404 });
			}

			const voucher = this.state.vouchers[voucherId];
			if (!voucher) {
				return Response.json({ error: "Voucher not found" }, { status: 404 });
			}

			return Response.json({ success: true, voucher });
		} catch (error) {
			console.error("Failed to get voucher:", error);
			return Response.json(
				{
					error: "Failed to get voucher",
					details: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 },
			);
		}
	}

	async deleteVoucher(voucherId: string): Promise<Response> {
		try {
			const updatedVouchers = { ...this.state.vouchers };
			delete updatedVouchers[voucherId];
			this.setState({ ...this.state, vouchers: updatedVouchers });
			return Response.json({ success: true });
		} catch (error) {
			console.error("Failed to delete voucher:", error);
			return Response.json(
				{ error: "Failed to delete voucher" },
				{ status: 500 },
			);
		}
	}

	async parseInvoice(data: { image: Uint8Array }): Promise<Response> {
		try {
			this.setState({ ...this.state, processingStatus: "parsing" });
			const model = await this.getModel();

			const { object: invoice } = await generateObject({
				model,
				schema: InvoiceApiSchema,
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: "Extract: invoice number, date (YYYY-MM-DD), vendor name, total, items (description, quantity, price)",
							},
							{
								type: "image",
								image: data.image,
							},
						],
					},
				],
			});

			this.setState({
				...this.state,
				correctedInvoice: invoice,
				processingStatus: "idle",
			});

			this.broadcast(JSON.stringify({ type: "parsed_invoice", data: invoice }));
			return Response.json({ type: "parsed_invoice", data: invoice });
		} catch (error) {
			console.error("Invoice parsing failed:", error);
			this.setState({ ...this.state, processingStatus: "idle" });

			return Response.json(
				{
					type: "error",
					message:
						error instanceof Error ? error.message : "Unknown parse error",
					details: error instanceof Error ? error.stack : String(error),
				},
				{ status: 500 },
			);
		}
	}

	async onMessage(_: Connection, message: WSMessage) {
		// Handle WebSocket message (string or ArrayBuffer)
		let messageData: string;
		if (typeof message === "string") {
			messageData = message;
		} else if (message instanceof ArrayBuffer) {
			messageData = new TextDecoder().decode(message);
		} else {
			console.error("Unsupported message type:", typeof message);
			return;
		}

		let data: any;
		try {
			data = JSON.parse(messageData);
		} catch (error) {
			console.error("Failed to parse message:", error);
			return;
		}

		// Handle invoice editing
		if (data.type === "edit_invoice") {
			const result = InvoiceApiSchema.safeParse(data.data);
			if (result.success) {
				this.setState({ ...this.state, correctedInvoice: result.data });
			}
		}

		// Handle voucher generation
		if (data.type === "generate_voucher") {
			const invoice = this.state.correctedInvoice;
			if (!invoice) return;

			try {
				this.setState({ ...this.state, processingStatus: "generating" });

				// Get AI-powered accounting guidance
				const accountingGuidance = await this.getAccountingGuidance(invoice);
				const model = await this.getModel();
				const voucherId = generateVoucherId();

				const { object: voucher } = await generateObject({
					model,
					schema: VoucherSchema,
					messages: [
						{
							role: "system",
							content: `You are an expert accountant creating US GAAP compliant journal vouchers.

IMPORTANT REQUIREMENTS:
- Use the exact voucherId provided: ${voucherId}
- Use proper 4-digit account codes (1000-7999 range)
- Include specific ASC references in GAAP reasoning
- Ensure debits equal credits exactly
- Use professional account names

Common Account Codes:
- 1000-1999: Assets (1000=Cash, 1200=Accounts Receivable, 1300=Inventory)
- 2000-2999: Liabilities (2000=Accounts Payable, 2100=Accrued Expenses)
- 3000-3999: Equity
- 4000-4999: Revenue
- 5000-5999: Cost of Goods Sold
- 6000-6999: Operating Expenses (6100=Office Supplies, 6200=Rent, 6300=Utilities)
- 7000-7999: Other Expenses

Use this accounting guidance: ${accountingGuidance}`,
						},
						{
							role: "user",
							content: `Create a professional journal voucher for this invoice:

Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.date}
Vendor: ${invoice.vendorName}
Total: $${invoice.total}
Items: ${invoice.items.map((i) => `${i.description} (${i.quantity} × $${i.price})`).join(", ")}

Requirements:
- voucherId: ${voucherId}
- date: ${invoice.date}
- description: "${invoice.vendorName} - Invoice #${invoice.invoiceNumber}"
- Create balanced debit/credit entries with proper account codes
- Include detailed GAAP reasoning with ASC references (e.g., "ASC 720-15" for prepaid expenses)
- Use current ISO timestamp for createdAt
- Ensure all amounts are exactly balanced`,
						},
					],
				});

				// Store the generated voucher
				const updatedVouchers = {
					...this.state.vouchers,
					[voucher.voucherId]: voucher,
				};

				this.setState({
					...this.state,
					vouchers: updatedVouchers,
					processingStatus: "idle",
				});

				const voucherText = `Voucher ${voucher.voucherId} created for ${invoice.vendorName}`;
				this.broadcast(
					JSON.stringify({ type: "voucher", data: voucherText, voucher }),
				);
			} catch (error) {
				console.error("Voucher generation failed:", error);
				this.setState({ ...this.state, processingStatus: "idle" });

				this.broadcast(
					JSON.stringify({
						type: "validation_errors",
						errors: [{ message: "Generation failed" }],
					}),
				);
			}
		}
	}
}

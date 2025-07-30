import { z } from "zod";

// Base Invoice Schema for API/Storage (uses string dates)
export const InvoiceApiSchema = z.object({
	invoiceNumber: z.string().min(1, "Invoice number is required"),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	vendorName: z.string().min(1, "Vendor name is required"),
	total: z.number().positive("Total must be positive"),
	items: z
		.array(
			z.object({
				description: z.string().min(1, "Description is required"),
				quantity: z.number().positive("Quantity must be positive"),
				price: z.number().positive("Price must be positive"),
			}),
		)
		.min(1, "At least one item is required"),
});

// Form Invoice Schema (uses Date objects for form handling)
export const InvoiceFormSchema = z.object({
	invoiceNumber: z.string().min(1, "Invoice number is required"),
	date: z.date({ required_error: "Date is required" }),
	vendorName: z.string().min(1, "Vendor name is required"),
	total: z.number().positive("Total must be positive"),
	items: z
		.array(
			z.object({
				description: z.string().min(1, "Description is required"),
				quantity: z.number().positive("Quantity must be positive"),
				price: z.number().positive("Price must be positive"),
			}),
		)
		.min(1, "At least one item is required"),
});

// Voucher Schema
export const VoucherSchema = z.object({
	voucherId: z
		.string()
		.describe("Unique voucher ID in format VCH-YYYYMMDD-XXX"),
	date: z.string().describe("Invoice date in YYYY-MM-DD format"),
	description: z
		.string()
		.describe("Brief description like 'Vendor Name - Invoice #XXXXX'"),
	entries: z.array(
		z.object({
			accountName: z
				.string()
				.describe("Account name like 'Office Supplies' or 'Accounts Payable'"),
			accountCode: z
				.string()
				.describe("4-digit account code like '6100' or '2000'"),
			debit: z.number().describe("Debit amount (0.00 if not applicable)"),
			credit: z.number().describe("Credit amount (0.00 if not applicable)"),
			gaapReasoning: z
				.string()
				.describe("Detailed GAAP reasoning with ASC references"),
		}),
	),
	createdAt: z.string().describe("ISO timestamp when voucher was created"),
});

// WebSocket Message Schema
export const WSMessageSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("parsed_invoice"),
		data: InvoiceApiSchema,
	}),
	z.object({
		type: z.literal("voucher"),
		data: z.string(),
		voucher: VoucherSchema,
	}),
	z.object({
		type: z.literal("validation_errors"),
		errors: z.any(),
	}),
	z.object({
		type: z.literal("edit_invoice"),
		data: InvoiceApiSchema,
	}),
	z.object({
		type: z.literal("generate_voucher"),
	}),
]);

import type { z } from "zod";
import type {
	InvoiceApiSchema,
	InvoiceFormSchema,
	VoucherSchema,
	WSMessageSchema,
} from "../schemas";

// Inferred types from schemas
export type InvoiceApi = z.infer<typeof InvoiceApiSchema>;
export type InvoiceForm = z.infer<typeof InvoiceFormSchema>;
export type Voucher = z.infer<typeof VoucherSchema>;
export type WSMessage = z.infer<typeof WSMessageSchema>;

// Additional types
export interface VoucherValidation {
	isValid: boolean;
	complianceScore: number;
	issues: string[];
}

// Utility type for converting between form and API invoice formats
export type InvoiceFormToApi = (formData: InvoiceForm) => InvoiceApi;
export type InvoiceApiToForm = (apiData: InvoiceApi) => InvoiceForm;

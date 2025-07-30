import type { InvoiceApi, InvoiceForm } from "../";

// Utility functions for converting between form and API formats
export const convertFormToApi = (formData: InvoiceForm): InvoiceApi => {
	const dateString = formData.date.toISOString().split("T")[0];
	if (!dateString) {
		throw new Error("Invalid date format");
	}

	return {
		...formData,
		date: dateString,
	};
};

export const convertApiToForm = (apiData: InvoiceApi): InvoiceForm => ({
	...apiData,
	date: new Date(apiData.date), // Convert string to Date object
});

// Voucher utility functions
export const calculateVoucherTotals = (voucher: {
	entries: Array<{ debit: number; credit: number }>;
}) => {
	const totalDebits = voucher.entries.reduce(
		(sum, entry) => sum + entry.debit,
		0,
	);
	const totalCredits = voucher.entries.reduce(
		(sum, entry) => sum + entry.credit,
		0,
	);
	const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

	return {
		totalDebits,
		totalCredits,
		difference: Math.abs(totalDebits - totalCredits),
		isBalanced,
	};
};

// Generate voucher ID utility
export const generateVoucherId = (): string => {
	const now = new Date();
	const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
	const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
	return `VCH-${dateStr}-${sequence}`;
};

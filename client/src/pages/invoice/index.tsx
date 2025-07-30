"use client";

import { InvoiceUpload } from "@/components/invoice/invoice-upload";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { useInstance } from "@/contexts/instance-context";

export default function InvoicePage() {
	const { instanceId } = useInstance();

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-6 py-8">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold tracking-tight">
						Invoice Processing
					</h1>
					<p className="text-muted-foreground mt-1">
						Upload an invoice image to extract data and generate a journal
						voucher
					</p>
				</div>

				<div className="space-y-8">
					<InvoiceUpload instanceId={instanceId} />
					<InvoiceEditor instanceId={instanceId} />
				</div>
			</div>
		</div>
	);
}

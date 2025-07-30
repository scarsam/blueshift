"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgent } from "agents/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

import {
	InvoiceFormSchema,
	convertFormToApi,
	convertApiToForm,
	type InvoiceForm,
} from "shared";

export function InvoiceEditor({ instanceId }: { instanceId: string }) {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const connection = useAgent({
		agent: "invoice-agent",
		name: instanceId,
		onMessage: (msg) => {
			const data = JSON.parse(msg.data);
			if (data.type === "parsed_invoice") {
				// Convert date string to Date object
				const invoiceData = convertApiToForm(data.data);

				reset(invoiceData);
				toast.success("Invoice parsed!");
			} else if (data.type === "voucher") {
				setLoading(false);
				toast.success("Voucher generated!");
				navigate(`/vouchers/${data.voucher.voucherId}`);
			} else if (data.type === "validation_errors") {
				setLoading(false);
				toast.error("Error occurred");
			}
		},
	});

	const { control, handleSubmit, reset, formState, watch } =
		useForm<InvoiceForm>({
			resolver: zodResolver(InvoiceFormSchema),
			defaultValues: {
				invoiceNumber: "",
				date: new Date(),
				vendorName: "",
				total: 0,
				items: [],
			},
		});

	const { fields, append, remove } = useFieldArray({ control, name: "items" });
	const watchedItems = watch("items");
	const calculatedTotal =
		watchedItems?.reduce(
			(sum, item) => sum + (item.quantity || 0) * (item.price || 0),
			0,
		) || 0;

	const onSubmit = (data: InvoiceForm) => {
		if (!connection.send) return;

		const updatedData = {
			...convertFormToApi(data),
			total: calculatedTotal,
		};

		connection.send(
			JSON.stringify({ type: "edit_invoice", data: updatedData }),
		);
		connection.send(JSON.stringify({ type: "generate_voucher" }));
		setLoading(true);
	};

	return (
		<div className="border border-border/50 rounded-lg overflow-hidden">
			<div className="p-6">
				<div className="flex items-center gap-3 mb-6">
					<FileText className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-medium">Invoice Details</h2>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="invoiceNumber"
								className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block"
							>
								Invoice Number
							</label>
							<Controller
								name="invoiceNumber"
								control={control}
								render={({ field }) => (
									<Input {...field} placeholder="Enter invoice number" />
								)}
							/>
						</div>
						<div>
							<label
								htmlFor="date"
								className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block"
							>
								Date
							</label>
							<Controller
								name="date"
								control={control}
								render={({ field }) => (
									<DatePicker
										value={field.value}
										onChange={field.onChange}
										placeholder="Select invoice date"
									/>
								)}
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="vendorName"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block"
						>
							Vendor Name
						</label>
						<Controller
							name="vendorName"
							control={control}
							render={({ field }) => (
								<Input {...field} placeholder="Enter vendor name" />
							)}
						/>
					</div>

					<div>
						<div className="flex justify-between items-center mb-4">
							<label
								htmlFor=""
								className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Items
							</label>
							<Button
								type="button"
								onClick={() =>
									append({ description: "", quantity: 1, price: 0 })
								}
								size="sm"
								variant="outline"
							>
								<Plus className="w-3 h-3 mr-1" />
								Add Item
							</Button>
						</div>

						<div className="space-y-3">
							{fields.map((item, index) => (
								<div
									key={item.id}
									className="grid grid-cols-12 gap-3 p-3 border border-border/50 rounded-lg"
								>
									<div className="col-span-5">
										<Controller
											name={`items.${index}.description`}
											control={control}
											render={({ field }) => (
												<Input {...field} placeholder="Description" />
											)}
										/>
									</div>
									<div className="col-span-2">
										<Controller
											name={`items.${index}.quantity`}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													type="number"
													placeholder="Qty"
													onChange={(e) => field.onChange(+e.target.value)}
												/>
											)}
										/>
									</div>
									<div className="col-span-3">
										<Controller
											name={`items.${index}.price`}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													type="number"
													step="0.01"
													placeholder="Price"
													onChange={(e) => field.onChange(+e.target.value)}
												/>
											)}
										/>
									</div>
									<div className="col-span-2 flex items-center justify-end">
										<Button
											type="button"
											onClick={() => remove(index)}
											size="sm"
											variant="ghost"
											className="text-red-600 hover:text-red-700"
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-between items-center pt-4 border-t border-border/50">
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Total
						</div>
						<div className="text-xl font-semibold font-mono">
							${calculatedTotal.toFixed(2)}
						</div>
					</div>

					<Button
						type="submit"
						disabled={!formState.isValid || loading}
						className="w-full"
						size="lg"
					>
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Generating Voucher...
							</>
						) : (
							"Generate Voucher"
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}

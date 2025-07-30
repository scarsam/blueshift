"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useInstance } from "@/contexts/instance-context";
import type { Voucher } from "shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787";

export default function VoucherList() {
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [loading, setLoading] = useState(true);
	const { instanceId } = useInstance();

	const fetchVouchers = async () => {
		try {
			const response = await fetch(
				`${SERVER_URL}/api/vouchers?instanceId=${instanceId}`,
			);
			const data = await response.json();
			if (data.success) setVouchers(data.vouchers);
		} catch (error) {
			toast.error("Failed to load vouchers");
		} finally {
			setLoading(false);
		}
	};

	const deleteVoucher = async (id: string) => {
		try {
			await fetch(`${SERVER_URL}/api/vouchers/${id}?instanceId=${instanceId}`, {
				method: "DELETE",
			});
			setVouchers((prev) => prev.filter((v) => v.voucherId !== id));
			toast.success("Voucher deleted");
		} catch (error) {
			toast.error("Delete failed");
		}
	};

	useEffect(() => {
		fetchVouchers();
	}, [instanceId]);

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-5xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">Vouchers</h1>
						<p className="text-muted-foreground mt-1">
							Journal vouchers generated from invoices
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchVouchers}
						className="gap-2 bg-transparent"
					>
						<RefreshCw className="h-3 w-3" />
						Refresh
					</Button>
				</div>

				{vouchers.length === 0 ? (
					<div className="text-center py-24">
						<FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
						<h3 className="text-lg font-medium mb-2">No vouchers yet</h3>
						<p className="text-muted-foreground mb-6">
							Upload an invoice to create your first voucher
						</p>
						<Button asChild>
							<Link to="/">Upload Invoice</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-1">
						{vouchers.map((voucher) => {
							const totalAmount = voucher.entries.reduce(
								(sum, entry) => sum + entry.debit,
								0,
							);

							return (
								<div
									key={voucher.voucherId}
									className="border border-border/50 rounded-lg hover:border-border hover:shadow-sm transition-all duration-200"
								>
									<div className="p-6">
										<div className="flex justify-between items-start">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-2">
													<h3 className="font-medium truncate">
														{voucher.description}
													</h3>
													<Badge
														variant="outline"
														className="text-xs font-mono shrink-0"
													>
														{voucher.voucherId}
													</Badge>
												</div>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span>{voucher.date}</span>
													<span>•</span>
													<span>{voucher.entries.length} entries</span>
													<span>•</span>
													<span>
														Created{" "}
														{new Date(voucher.createdAt).toLocaleDateString()}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-4 ml-6">
												<div className="text-right">
													<div className="text-xl font-semibold font-mono">
														${totalAmount.toFixed(2)}
													</div>
												</div>

												{/* Always show actions - removed validate button */}
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														asChild
														className="text-muted-foreground hover:text-foreground bg-transparent"
													>
														<Link to={`/vouchers/${voucher.voucherId}`}>
															<Eye className="h-3 w-3 mr-2" />
															View
														</Link>
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteVoucher(voucher.voucherId)}
														className="text-muted-foreground hover:text-red-600"
													>
														<Trash2 className="h-3 w-3 mr-2" />
														Delete
													</Button>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useInstance } from "@/contexts/instance-context";
import { calculateVoucherTotals, type Voucher } from "shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787";

export default function VoucherDetail() {
	const { id } = useParams<{ id: string }>();
	const { instanceId } = useInstance();
	const [voucher, setVoucher] = useState<Voucher | null>(null);
	const [loading, setLoading] = useState(true);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (!id) return;

		const fetchVoucher = async () => {
			try {
				const response = await fetch(
					`${SERVER_URL}/api/vouchers/${id}?instanceId=${instanceId}`,
				);
				const data = await response.json();
				if (data.success) setVoucher(data.voucher);
			} catch (error) {
				toast.error("Failed to load voucher");
			} finally {
				setLoading(false);
			}
		};

		fetchVoucher();
	}, [id, instanceId]);

	const toggleRow = (index: number) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedRows(newExpanded);
	};

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);

	if (!voucher)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-muted-foreground">Voucher not found</div>
			</div>
		);

	const { totalDebits, totalCredits, isBalanced } =
		calculateVoucherTotals(voucher);

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Header - Back button moved to top left corner */}
				<div className="mb-6">
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="text-muted-foreground hover:text-foreground mb-4"
					>
						<Link to="/vouchers">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Vouchers
						</Link>
					</Button>

					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight">
								Journal Voucher
							</h1>
							<p className="text-muted-foreground mt-1">
								{voucher.description}
							</p>
						</div>
						<Badge
							variant={isBalanced ? "default" : "destructive"}
							className="px-3 py-1"
						>
							{isBalanced ? "Balanced" : "Unbalanced"}
						</Badge>
					</div>
				</div>

				{/* Voucher Info */}
				<div className="grid grid-cols-3 gap-8 mb-12 pb-8 border-b border-border/50">
					<div>
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Voucher ID
						</div>
						<div className="font-mono text-sm">{voucher.voucherId}</div>
					</div>
					<div>
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Date
						</div>
						<div className="text-sm">{voucher.date}</div>
					</div>
					<div>
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Entries
						</div>
						<div className="text-sm">{voucher.entries.length} entries</div>
					</div>
				</div>

				{/* Journal Entries */}
				<div className="mb-12">
					<h2 className="text-lg font-medium mb-6">Journal Entries</h2>

					<div className="border border-border/50 rounded-lg overflow-hidden">
						{/* Table Header */}
						<div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border/50">
							<div className="col-span-1"></div>
							<div className="col-span-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
								Account
							</div>
							<div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
								Code
							</div>
							<div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
								Debit
							</div>
							<div className="col-span-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
								Credit
							</div>
						</div>

						{/* Table Body */}
						{voucher.entries.map((entry, index) => (
							<div key={index}>
								<div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors border-b border-border/30 last:border-b-0">
									<div className="col-span-1 flex items-center">
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
											onClick={() => toggleRow(index)}
										>
											{expandedRows.has(index) ? (
												<ChevronDown className="h-3 w-3" />
											) : (
												<ChevronRight className="h-3 w-3" />
											)}
										</Button>
									</div>
									<div className="col-span-4 flex items-center font-medium">
										{entry.accountName}
									</div>
									<div className="col-span-2 flex items-center">
										<Badge variant="outline" className="text-xs font-mono">
											{entry.accountCode}
										</Badge>
									</div>
									<div className="col-span-2 flex items-center justify-end font-mono text-sm">
										{entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "—"}
									</div>
									<div className="col-span-3 flex items-center justify-end font-mono text-sm">
										{entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "—"}
									</div>
								</div>

								{expandedRows.has(index) && (
									<div className="px-6 py-4 bg-muted/10 border-b border-border/30 last:border-b-0">
										<div className="ml-10">
											<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
												GAAP Reasoning
											</div>
											<div className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
												{entry.gaapReasoning}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Totals */}
				<div className="grid grid-cols-3 gap-8 py-8 border-t border-border/50">
					<div className="text-center">
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Total Debits
						</div>
						<div className="text-2xl font-semibold font-mono">
							${totalDebits.toFixed(2)}
						</div>
					</div>
					<div className="text-center">
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Total Credits
						</div>
						<div className="text-2xl font-semibold font-mono">
							${totalCredits.toFixed(2)}
						</div>
					</div>
					<div className="text-center">
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Difference
						</div>
						<div
							className={`text-2xl font-semibold font-mono ${isBalanced ? "text-green-600" : "text-red-600"}`}
						>
							${Math.abs(totalDebits - totalCredits).toFixed(2)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="text-center text-xs text-muted-foreground pt-8 border-t border-border/30">
					Created {new Date(voucher.createdAt).toLocaleDateString()} at{" "}
					{new Date(voucher.createdAt).toLocaleTimeString()}
				</div>
			</div>
		</div>
	);
}

"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787";

interface UploadFormProps {
	instanceId: string;
}

export function InvoiceUpload({ instanceId }: UploadFormProps) {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	const validateFile = (file: File): string | null => {
		if (!file.type.startsWith("image/")) {
			return "Please select an image file";
		}

		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return "File size must be less than 10MB";
		}

		return null;
	};

	const handleFileSelect = (selectedFile: File) => {
		const error = validateFile(selectedFile);
		if (error) {
			toast.error(error);
			return;
		}

		setFile(selectedFile);
		toast.success("File selected successfully");
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);

		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) {
			handleFileSelect(droppedFile);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
	};

	const uploadToBackend = async () => {
		if (!file) {
			toast.error("Please select a file first");
			return;
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("instanceId", instanceId);

			const response = await fetch(`${SERVER_URL}/api/upload`, {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Upload failed");
			}

			if (result.type === "parsed_invoice") {
				toast.success("Invoice uploaded and parsed successfully!");
			} else if (result.type === "error") {
				throw new Error(result.message);
			}
		} catch (error) {
			console.error("Upload error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Upload failed";
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="border border-border/50 rounded-lg overflow-hidden">
			<div className="p-6">
				<div className="flex items-center gap-3 mb-6">
					<Upload className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-medium">Upload Invoice</h2>
				</div>

				<div
					className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
						dragOver
							? "border-primary bg-primary/5"
							: file
								? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
								: "border-border hover:border-border/80"
					}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
				>
					{file ? (
						<div className="space-y-3">
							<FileImage className="w-12 h-12 mx-auto text-green-600" />
							<div>
								<p className="font-medium text-green-700 dark:text-green-400">
									{file.name}
								</p>
								<p className="text-sm text-muted-foreground">
									{(file.size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<Upload className="w-12 h-12 mx-auto text-muted-foreground/50" />
							<div>
								<p className="font-medium">Drop your invoice here</p>
								<p className="text-sm text-muted-foreground">
									or click to select a file
								</p>
							</div>
						</div>
					)}
				</div>

				<Input
					type="file"
					accept="image/*"
					onChange={(e) => {
						const selectedFile = e.target.files?.[0];
						if (selectedFile) {
							handleFileSelect(selectedFile);
						}
					}}
					className="mt-4 cursor-pointer"
				/>

				<Button
					onClick={uploadToBackend}
					disabled={!file || loading}
					className="w-full mt-6"
					size="lg"
				>
					{loading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Processing...
						</>
					) : (
						<>
							<Upload className="w-4 h-4 mr-2" />
							Upload and Parse Invoice
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

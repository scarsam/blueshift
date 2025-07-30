"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Receipt } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useInstance } from "@/contexts/instance-context";

export default function Header() {
	const { instanceId } = useInstance();

	return (
		<header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<nav className="flex items-center justify-between">
					{/* Brand */}
					<div className="flex items-center space-x-8">
						<Link
							to="/"
							className="text-xl font-semibold tracking-tight hover:text-primary transition-colors"
						>
							Blueshift
						</Link>

						{/* Navigation */}
						<div className="hidden md:flex items-center space-x-1">
							<Button
								variant="ghost"
								size="sm"
								asChild
								className="text-muted-foreground hover:text-foreground"
							>
								<Link to="/" className="flex items-center gap-2">
									<FileText className="h-4 w-4" />
									Upload
								</Link>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								asChild
								className="text-muted-foreground hover:text-foreground"
							>
								<Link to="/vouchers" className="flex items-center gap-2">
									<Receipt className="h-4 w-4" />
									Vouchers
								</Link>
							</Button>
						</div>
					</div>

					{/* Right side */}
					<div className="flex items-center gap-4">
						<div className="hidden sm:block text-xs text-muted-foreground font-mono">
							{instanceId.slice(-8)}
						</div>
						<ThemeToggle />
					</div>
				</nav>
			</div>
		</header>
	);
}

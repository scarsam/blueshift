import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { InstanceProvider } from "./contexts/instance-context";
import VoucherDetail from "./pages/voucher/voucher-details";
import VoucherList from "./pages/voucher/voucher-list";
import Header from "./components/layout/header";
import InvoicePage from "./pages/invoice";

const App = () => {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="invoice-workflow-theme">
			<InstanceProvider>
				<Router>
					<div className="min-h-screen bg-background">
						<Header />
						<main className="container mx-auto px-4 py-8">
							<Routes>
								<Route path="/" element={<InvoicePage />} />
								<Route path="/vouchers" element={<VoucherList />} />
								<Route path="/vouchers/:id" element={<VoucherDetail />} />
							</Routes>
						</main>
						<Toaster />
					</div>
				</Router>
			</InstanceProvider>
		</ThemeProvider>
	);
};

export default App;

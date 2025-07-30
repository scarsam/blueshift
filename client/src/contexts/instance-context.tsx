"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

interface InstanceContextType {
	instanceId: string;
	setInstanceId: (id: string) => void;
}

const InstanceContext = createContext<InstanceContextType | undefined>(
	undefined,
);

export function InstanceProvider({ children }: { children: ReactNode }) {
	const [instanceId, setInstanceId] = useState<string>(() => {
		// Try to get from localStorage first
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("invoice-instance-id");
			if (stored) return stored;
		}
		// Generate new one if none exists
		return `invoice-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	});

	// Save to localStorage whenever it changes
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("invoice-instance-id", instanceId);
		}
	}, [instanceId]);

	return (
		<InstanceContext.Provider value={{ instanceId, setInstanceId }}>
			{children}
		</InstanceContext.Provider>
	);
}

export function useInstance() {
	const context = useContext(InstanceContext);
	if (context === undefined) {
		throw new Error("useInstance must be used within an InstanceProvider");
	}
	return context;
}

"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import DealerSidebar from "./DealerSidebar";
import DealerSidebarToggle from "./DealerSidebarToggle";

export default function DealerClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <DealerSidebar />

                {/* Mobile header */}
                <div className="md:hidden w-full border-b bg-white p-4 sticky top-0 z-10 flex items-center justify-between">
                    <h1 className="text-lg font-bold">Dealer Admin</h1>
                    <DealerSidebarToggle />
                </div>

                {/* Main content */}
                <main className="flex-1 p-6 ml-16 md:ml-60">{children}</main>
            </div>
        </SidebarProvider>
    );
}

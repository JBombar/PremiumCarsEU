"use client";

import DealerSidebar from "@/components/dealer/DealerSidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DealerContent({ children }: { children: React.ReactNode }) {
    const { sidebarWidth } = useSidebar();

    return (
        <main
            style={{
                marginLeft: sidebarWidth,
                width: `calc(100% - ${sidebarWidth})`,
                transition: "margin-left 0.3s ease-in-out, width 0.3s ease-in-out",
            }}
            className="min-h-screen bg-white p-6"
        >
            {children}
        </main>
    );
}

export default function DealerAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <DealerSidebar />
                <DealerContent>{children}</DealerContent>
            </div>
        </SidebarProvider>
    );
}

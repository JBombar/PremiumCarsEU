"use client";

import Sidebar from "@/components/admin/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

// Create a content component that uses the sidebar context
function AdminContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar();

  return (
    <main
      style={{
        marginLeft: sidebarWidth,
        width: `calc(100% - ${sidebarWidth})`,
        transition: "margin-left 0.3s ease-in-out, width 0.3s ease-in-out"
      }}
      className="min-h-screen bg-gray-50 p-6"
    >
      {children}
    </main>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
} 
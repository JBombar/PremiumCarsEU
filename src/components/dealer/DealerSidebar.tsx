"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
    Car,
    LayoutGrid,
    CalendarClock,
    ClipboardCheck,
    LogOut,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    User,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";

export default function DealerSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { collapsed, toggleSidebar } = useSidebar();

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { name: "Dashboard", href: "/dealer-admin", icon: LayoutGrid },
        { name: "Inventory", href: "/dealer-admin/inventory", icon: Car },
        { name: "Reservations", href: "/dealer-admin/reservations", icon: ClipboardCheck },
        { name: "Test Drives", href: "/dealer-admin/test-drive-reservations", icon: CalendarClock },
    ];

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push("/login");
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-60"
                }`}
        >
            {/* Logo & Brand */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {!collapsed ? (
                    <div className="flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        <span className="font-semibold text-lg">Dealer Admin</span>
                    </div>
                ) : (
                    <Car className="h-6 w-6 mx-auto" />
                )}
                <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-1">
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            {/* User Info */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-2">
                        <User className="h-5 w-5 text-gray-600" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Partner Dealer</span>
                            <span className="text-xs text-gray-500">Dealer Role</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
                                        } px-3 py-2 rounded-md text-sm ${isActive(item.href)
                                            ? "bg-gray-100 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    title={collapsed ? item.name : ""}
                                >
                                    <Icon className="h-5 w-5" />
                                    {!collapsed && item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-4 mt-auto">
                <div className="space-y-2">
                    {!collapsed ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-gray-700"
                                onClick={() => router.push("/")}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Back to Website
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-center text-gray-700 mb-2"
                                onClick={() => router.push("/")}
                                title="Back to Website"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center text-gray-700 hover:text-red-600 hover:bg-red-50"
                                onClick={handleLogout}
                                title="Log out"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Car,
    CalendarClock,
    ClipboardCheck,
    LogOut,
} from "lucide-react";

import type { Database } from "@/types/supabase";

// Metadata
export const metadata = {
    title: "Dealer Admin | CarBiz Platform",
    description: "Dealer partner administration panel",
};

interface NavItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
}

function NavItem({ href, label, icon, isActive }: NavItemProps) {
    return (
        <Link href={href} className="w-full">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-2",
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                )}
            >
                {icon}
                {label}
            </Button>
        </Link>
    );
}

export default async function DealerAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookies().get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookies().set({ name, value, ...options });
                    } catch { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookies().set({ name, value: "", ...options });
                    } catch { }
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return redirect("/auth/signin?callbackUrl=/dealer-admin");
    }

    const { data: dealerPartner } = await supabase
        .from("dealer_partners")
        .select("*")
        .eq("dealer_user_id", session.user.id)
        .single();

    if (!dealerPartner) {
        return redirect("/");
    }

    const pathname =
        headers().get("x-pathname") ?? "/dealer-admin"; // fallback to dashboard path

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card p-4 hidden md:flex flex-col">
                <div className="mb-8">
                    <h1 className="text-xl font-bold">Dealer Admin</h1>
                    <p className="text-sm text-muted-foreground">
                        {dealerPartner.business_name ?? "Partner Dealer"}
                    </p>
                </div>

                <nav className="space-y-1 flex-1">
                    <NavItem
                        href="/dealer-admin"
                        label="Dashboard"
                        icon={<LayoutDashboard size={18} />}
                        isActive={pathname === "/dealer-admin"}
                    />
                    <NavItem
                        href="/dealer-admin/inventory"
                        label="Inventory"
                        icon={<Car size={18} />}
                        isActive={pathname.startsWith("/dealer-admin/inventory")}
                    />
                    <NavItem
                        href="/dealer-admin/reservations"
                        label="Reservations"
                        icon={<ClipboardCheck size={18} />}
                        isActive={pathname.startsWith("/dealer-admin/reservations")}
                    />
                    <NavItem
                        href="/dealer-admin/test-drive-reservations"
                        label="Test Drives"
                        icon={<CalendarClock size={18} />}
                        isActive={pathname.startsWith(
                            "/dealer-admin/test-drive-reservations"
                        )}
                    />
                </nav>

                <div className="mt-auto pt-4 border-t">
                    <form action="/api/auth/signout" method="post">
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start gap-2 text-muted-foreground"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="md:hidden w-full border-b bg-card p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold">Dealer Admin</h1>
                </div>
            </div>

            {/* Main content */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}

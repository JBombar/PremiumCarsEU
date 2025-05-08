"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Car,
  LayoutGrid,
  Users,
  Calendar,
  CreditCard,
  BarChart,
  Settings,
  User,
  CalendarClock,
  Tag,
  ClipboardList, // <-- Added icon import
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TruckIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { collapsed, toggleSidebar } = useSidebar();

  const isActive = (path: string) => {
    // Ensure exact match for dashboard, allow prefix match for others
    if (path === "/admin") {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutGrid },
    { name: "Inventory", href: "/admin/inventory", icon: Car },
    { name: "Car Offers", href: "/admin/car-offers", icon: Tag },
    { name: "Public Database", href: "/admin/public-database", icon: Car },
    { name: "Dealer Listings", href: "/admin/dealer-listings", icon: ClipboardList }, // <-- Added new navigation item
    { name: "Partners", href: "/admin/partners", icon: Users },
    { name: "Leads", href: "/admin/leads", icon: Users },
    { name: "Reservations", href: "/admin/reservations", icon: Calendar },
    { name: "Test Drive Reservations", href: "/admin/test-drive-reservations", icon: CalendarClock },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Rental Reservations", href: "/admin/rentals", icon: Calendar },
    { name: "Rental Inventory", href: "/admin/rental-inventory", icon: Car },
    { name: "Rental Transactions", href: "/admin/rental-transactions", icon: CreditCard },
    { name: "Rental Clients", href: "/admin/rental-clients", icon: Users },
    { name: "Rental Investors", href: "/admin/rental-investors", icon: Users },





  ];

  // Handle logout function
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Redirect to login, ensuring it's a full page reload if needed
      // to clear any sensitive client-side state.
      window.location.href = "/login";
    } else {
      console.error("Logout failed:", error);
      // Optionally show a toast message on error
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-60"
        }`}
    >
      {/* Logo & Brand */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between h-16"> {/* Fixed height */}
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap"> {/* Prevent wrap */}
              <Car className="h-6 w-6 flex-shrink-0" /> {/* Prevent shrink */}
              <span className="font-semibold text-lg">PremiumCarsEU</span>
            </div>
          </>
        )}
        {collapsed && (
          <Car className="h-6 w-6 mx-auto" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-1 flex-shrink-0" // Prevent shrink
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-200 p-4 h-16 flex items-center"> {/* Fixed height */}
        <div className="flex items-center gap-3 overflow-hidden"> {/* Prevent overflow */}
          <div className="rounded-full bg-gray-100 p-2 flex-shrink-0"> {/* Prevent shrink */}
            <User className="h-5 w-5 text-gray-600" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap"> {/* Prevent wrap */}
              <span className="text-sm font-medium">Admin User</span> {/* Placeholder */}
              <span className="text-xs text-gray-500">Administrator</span>
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
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-md text-sm ${isActive(item.href)
                    ? "bg-gray-100 font-medium text-gray-900" // Ensure text color contrast on active
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  title={collapsed ? item.name : ""}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" /> {/* Prevent shrink */}
                  {!collapsed && <span className="truncate">{item.name}</span>} {/* Truncate text */}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom action buttons */}
      <div className="border-t border-gray-200 p-4 mt-auto">
        <div className="space-y-2">
          {!collapsed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-700"
                onClick={() => router.push("/")} // Use router for client-side nav
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
                size="icon" // Use size="icon" for collapsed state
                className="w-full justify-center text-gray-700 mb-2"
                onClick={() => router.push("/")} // Use router for client-side nav
                title="Back to Website"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon" // Use size="icon" for collapsed state
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
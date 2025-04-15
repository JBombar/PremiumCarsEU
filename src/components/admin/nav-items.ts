// components/admin/nav-items.ts
import {
    LayoutGrid,
    Car,
    Tag,
    Users,
    Calendar,
    CreditCard,
    BarChart,
    Settings,
    CalendarClock,
} from "lucide-react"

export const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutGrid },
    { name: "Inventory", href: "/admin/inventory", icon: Car },
    { name: "Car Offers", href: "/admin/car-offers", icon: Tag },
    { name: "Partners", href: "/admin/partners", icon: Users },
    { name: "Leads", href: "/admin/leads", icon: Users },
    { name: "Reservations", href: "/admin/reservations", icon: Calendar },
    { name: "Test Drive Reservations", href: "/admin/test-drive-reservations", icon: CalendarClock },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
    { name: "Settings", href: "/admin/settings", icon: Settings },
]

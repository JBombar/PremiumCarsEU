"use client"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, ExternalLink, User } from "lucide-react"
import { navItems } from "./nav-items"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import SidebarToggle from "./SidebarToggle" // ✅ Use the button you already created

export function MobileSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            router.push("/login")
        }
    }

    return (
        <Sheet>
            {/* ✅ Use SidebarToggle inside SheetTrigger */}
            <SheetTrigger asChild>
                <SidebarToggle onClick={() => { }} />
            </SheetTrigger>

            <SheetContent side="left" className="w-[260px] px-4 py-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-lg font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-600" />
                        Admin
                    </SheetTitle>
                </SheetHeader>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(`${item.href}/`)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isActive
                                        ? "bg-gray-100 font-medium text-primary"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-8 space-y-2 border-t pt-4">
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
                </div>
            </SheetContent>
        </Sheet>
    )
}

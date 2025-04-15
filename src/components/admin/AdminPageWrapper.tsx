"use client"

import { ReactNode } from "react"
import Sidebar from "./Sidebar"
import { MobileSidebar } from "./MobileSidebar"

export function AdminPageWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full px-4 md:pl-60 pt-4">
                {/* Mobile Sidebar Toggle */}
                <div className="md:hidden mb-4">
                    <MobileSidebar />
                </div>

                {children}
            </div>
        </div>
    )
}

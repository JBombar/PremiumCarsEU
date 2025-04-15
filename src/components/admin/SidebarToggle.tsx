"use client"

import { Menu } from "lucide-react"

export default function SidebarToggle({
    onClick,
}: {
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Open sidebar"
        >
            <Menu className="w-6 h-6 text-gray-700" />
        </button>
    )
}

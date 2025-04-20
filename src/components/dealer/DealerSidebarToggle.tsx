'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function DealerSidebarToggle() {
    const { toggleSidebar } = useSidebar();

    return (
        <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Open sidebar"
        >
            <Menu className="w-6 h-6 text-gray-700" />
        </button>
    );
}

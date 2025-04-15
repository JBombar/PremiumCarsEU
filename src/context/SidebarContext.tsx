"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
    collapsed: boolean;
    toggleSidebar: () => void;
    sidebarWidth: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const sidebarWidth = collapsed ? '4rem' : '15rem'; // 64px or 240px

    useEffect(() => {
        // Load saved preference on mount
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            setCollapsed(savedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
        localStorage.setItem('sidebarCollapsed', String(!collapsed));
    };

    return (
        <SidebarContext.Provider value={{ collapsed, toggleSidebar, sidebarWidth }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
} 
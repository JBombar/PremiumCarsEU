'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    expandSidebar: () => void;
    collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            setIsCollapsed(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const toggleSidebar = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const expandSidebar = useCallback(() => {
        setIsCollapsed(false);
    }, []);

    const collapseSidebar = useCallback(() => {
        setIsCollapsed(true);
    }, []);

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            toggleSidebar,
            expandSidebar,
            collapseSidebar
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebarContext() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
} 
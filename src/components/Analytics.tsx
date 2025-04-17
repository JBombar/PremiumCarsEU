'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// 👇 This tells TypeScript to stop crying about window.gtag
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

export default function Analytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            const pagePath = pathname + (searchParams.toString() ? `?${searchParams}` : '');
            window.gtag('config', 'G-29ELS5GRQ1', {
                page_path: pagePath,
            });
        }
    }, [pathname, searchParams]);

    return null;
}

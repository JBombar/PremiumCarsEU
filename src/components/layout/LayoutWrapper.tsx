'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/layout/Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isDealerAdminRoute = pathname?.startsWith('/dealer-admin');

  return (
    <>
      {!isAdminRoute && !isDealerAdminRoute && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdminRoute && !isDealerAdminRoute && <Footer />}
    </>
  );
} 
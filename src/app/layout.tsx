// Existing imports
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Toaster } from '@/components/ui/toaster';

// Imports required by next-intl documentation
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server'; // Make sure this path is correct based on your structure

const inter = Inter({ subsets: ['latin'] });

// Note: Metadata title/description might also need translation later,
// but we'll keep them static for now as per the current scope.
export const metadata: Metadata = {
  title: 'PremiumCarsEU - Find Your Perfect Car',
  description: 'Your premium destination for new and pre-owned vehicles',
};

// Add 'async' as required by getLocale()
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch the locale configured in i18n/request.ts
  const locale = await getLocale();

  return (
    // Set the lang attribute dynamically using the fetched locale
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Wrap your main application structure with NextIntlClientProvider */}
        {/* This makes the i18n context available to Client Components */}
        <NextIntlClientProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </NextIntlClientProvider>
        {/* Toaster can remain outside the provider if it doesn't need translations */}
        {/* or be moved inside if it does */}
        <Toaster />
      </body>
    </html>
  );
}
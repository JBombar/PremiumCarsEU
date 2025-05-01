import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Toaster } from '@/components/ui/toaster';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// GA4 + Next Script
import Script from 'next/script';
import Analytics from '@/components/Analytics'; // Your tracking component

// i18n
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PremiumCarsEU - Find Your Perfect Car',
  description: 'Your premium destination for new and pre-owned vehicles',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        {/* GA4 Script Tags */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-29ELS5GRQ1"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-29ELS5GRQ1', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <CurrencyProvider>
          <NextIntlClientProvider>
            <AuthProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </AuthProvider>
          </NextIntlClientProvider>
        </CurrencyProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

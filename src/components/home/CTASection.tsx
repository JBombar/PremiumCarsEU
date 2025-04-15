// src/components/home/CTASection.tsx
'use client'; // Add 'use client' directive

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl'; // Import useTranslations

export function CTASection() {
  const tCTA = useTranslations('CTASection'); // Hook for CTA specific texts
  const tNav = useTranslations('Navbar');    // Hook for reusing Navbar link texts

  return (
    <section className="py-16 bg-primary/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
        {/* Use translated title */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{tCTA('title')}</h2>
        {/* Use translated subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {tCTA('subtitle')}
        </p>
        <Button
          size="lg"
          className="px-8 py-6 text-base font-medium"
          asChild
        >
          {/* Use translated button text (reused from Navbar) */}
          <Link href="#request-car-form">{tNav('links.requestCar')}</Link>
        </Button>
      </div>
    </section>
  );
}
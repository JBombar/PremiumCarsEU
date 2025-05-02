// app/page.tsx (Adjusted Code)

// Import useTranslations
import { useTranslations } from 'next-intl';

import Link from 'next/link';
import { BrowseByType } from '@/components/browse/BrowseByType';
import { MostSearchedCars } from '@/components/home/MostSearchedCars';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { OurServices } from '@/components/home/OurServices';
import { SpecialOfferCarousel } from '@/components/home/SpecialOfferCarousel';
import { CTASection } from '@/components/home/CTASection';
import { RequestCarForm } from '@/components/home/RequestCarForm';

export default function HomePage() {
  // Initialize the hook with the namespace from en.json
  const t = useTranslations('HomePage');

  return (
    <>
      {/* ✅ Hero Section with Background Image */}
      <section className="relative w-full h-[75vh] flex items-center justify-center overflow-hidden">
        <img
          // Use translation for alt text
          src="/images/hero-car.jpg"
          alt={t('hero.imageAlt')}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Reduced opacity from 60% to 30% */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {/* Use translation for hero title */}
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl mb-6">
            {/* Use translation for hero subtitle */}
            {t('hero.subtitle')}
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/inventory"
              className="bg-white text-black font-semibold px-6 py-3 rounded-md hover:bg-gray-200 transition"
            >
              {/* Use translation for button text */}
              {t('hero.browseButton')}
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-black transition"
            >
              {/* Use translation for button text */}
              {t('hero.contactButton')}
            </Link>
          </div>
        </div>
      </section>


      <BrowseByType />
      <MostSearchedCars />
      <WhyChooseUs />
      <SpecialOfferCarousel />
      <OurServices />
      <CTASection />
      <RequestCarForm />
    </>
  );
}
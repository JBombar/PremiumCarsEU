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

      {/* Testimonials and Trust Indicators Section - Updated Layout */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          {/* What Customers Are Saying - First Row */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
              {/* Use translation for testimonials title */}
              {t('testimonials.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* TrustPilot Reviews Widget */}
              <div className="bg-white rounded-lg shadow-sm p-8 text-center flex flex-col items-center">
                {/* Use translation for TrustPilot title */}
                <h3 className="text-xl font-medium mb-4">{t('testimonials.trustpilot.title')}</h3>
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-6 h-6 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Use translation for TrustPilot quote */}
                <p className="italic text-muted-foreground">{t('testimonials.trustpilot.quote')}</p>
                {/* Use translation for TrustPilot author */}
                <div className="mt-4 font-medium">{t('testimonials.trustpilot.author')}</div>
              </div>

              {/* Google Reviews Widget */}
              <div className="bg-white rounded-lg shadow-sm p-8 text-center flex flex-col items-center">
                {/* Use translation for Google Reviews title */}
                <h3 className="text-xl font-medium mb-4">{t('testimonials.google.title')}</h3>
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-6 h-6 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Use translation for Google Reviews quote */}
                <p className="italic text-muted-foreground">{t('testimonials.google.quote')}</p>
                {/* Use translation for Google Reviews author */}
                <div className="mt-4 font-medium">{t('testimonials.google.author')}</div>
              </div>
            </div>
          </div>

          {/* Trusted by Thousands - Second Row */}
          <div className="bg-muted/30 rounded-xl p-10 mt-16">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
              {/* Use translation for stats title */}
              {t('stats.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Cars Sold Stat */}
              <div className="flex items-center justify-center gap-4">
                <div className="bg-background rounded-full p-4">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 19L5 19L5 9L19 9L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15L19 15L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">2,300+</div>
                  {/* Use translation for stats label */}
                  <div className="text-muted-foreground">{t('stats.carsSoldLabel')}</div>
                </div>
              </div>

              {/* Average Rating Stat */}
              <div className="flex items-center justify-center gap-4">
                <div className="bg-background rounded-full p-4">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9/5</div>
                  {/* Use translation for stats label */}
                  <div className="text-muted-foreground">{t('stats.averageRatingLabel')}</div>
                </div>
              </div>

              {/* Locations Stat */}
              <div className="flex items-center justify-center gap-4">
                <div className="bg-background rounded-full p-4">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">3</div>
                  {/* Use translation for stats label */}
                  <div className="text-muted-foreground">{t('stats.locationsLabel')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
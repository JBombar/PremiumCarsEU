// src/components/home/WhyChooseUs.tsx
'use client'; // Keep as client component

import { ShieldCheck, Clock, SmileIcon } from "lucide-react";
import { useTranslations } from 'next-intl'; // Import useTranslations

interface FeatureProps {
  icon: React.ReactNode;
  title: string; // Receives translated title
  description: string; // Receives translated description
}

// Feature component remains unchanged, receives translated props
const Feature = ({ icon, title, description }: FeatureProps) => (
  <div className="flex flex-col items-center text-center">
    <div className="rounded-full bg-primary/10 p-4 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 max-w-sm">{description}</p>
  </div>
);

export function WhyChooseUs() {
  const t = useTranslations('WhyChooseUs'); // Initialize hook

  // Define keys and icons, titles/descriptions will come from translations
  const featureKeys = [
    {
      key: 'quality', // Key to look up in JSON
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    },
    {
      key: 'process',
      icon: <Clock className="h-6 w-6 text-primary" />,
    },
    {
      key: 'customer',
      icon: <SmileIcon className="h-6 w-6 text-primary" />,
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Use translated title */}
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featureKeys.map((feature) => (
            <Feature
              key={feature.key} // Use the key for React key
              icon={feature.icon}
              // Get title and description from translations using the key
              title={t(`features.${feature.key}.title`)}
              description={t(`features.${feature.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
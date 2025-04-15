// src/components/home/OurServices.tsx
'use client'; // Add 'use client' directive

import { Wrench, Car, CreditCard } from "lucide-react";
import { useTranslations } from 'next-intl'; // Import useTranslations

interface ServiceProps {
  icon: React.ReactNode;
  title: string; // Receives translated title
  description: string; // Receives translated description
}

// ServiceCard component remains unchanged, receives translated props
const ServiceCard = ({ icon, title, description }: ServiceProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
    <div className="rounded-full bg-primary/10 p-4 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export function OurServices() {
  const t = useTranslations('OurServices'); // Initialize hook

  // Define keys and icons; titles/descriptions will come from translations
  const serviceKeys = [
    {
      key: 'maintenance', // Key to look up in JSON
      icon: <Wrench className="h-6 w-6 text-primary" />,
    },
    {
      key: 'tradeIn',
      icon: <Car className="h-6 w-6 text-primary" />,
    },
    {
      key: 'financing',
      icon: <CreditCard className="h-6 w-6 text-primary" />,
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Use translated title */}
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceKeys.map((service) => (
            <ServiceCard
              key={service.key} // Use the key for React key
              icon={service.icon}
              // Get title and description from translations using the key
              title={t(`services.${service.key}.title`)}
              description={t(`services.${service.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
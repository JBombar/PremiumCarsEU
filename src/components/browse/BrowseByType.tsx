// src/components/browse/BrowseByType.tsx
'use client'; // Keep this component as a Client Component to use the hook

import Link from 'next/link';
import {
  HiOutlineTruck,
  HiOutlineLightningBolt
} from 'react-icons/hi';
import {
  LuCar,
  LuCarFront,
  LuCarTaxiFront,
} from 'react-icons/lu';
import { PiCarProfileBold, PiVanBold, PiCarSimpleBold } from 'react-icons/pi';
import { TbCarSuv } from 'react-icons/tb';
import { useTranslations } from 'next-intl'; // Import useTranslations

interface VehicleTypeProps {
  icon: React.ReactNode;
  label: string; // Still pass label prop
  href: string;
}

// VehicleTypeCard remains unchanged as it receives the translated label via props
const VehicleTypeCard = ({ icon, label, href }: VehicleTypeProps) => (
  <Link href={href} className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="text-primary text-3xl mb-3">
      {icon}
    </div>
    <span className="text-gray-800 font-medium">{label}</span>
  </Link>
);

export function BrowseByType() {
  const t = useTranslations('BrowseByType'); // Initialize the hook

  // Keep the structure, but we'll use the translation hook for the label
  // Added a 'key' property to easily reference the translation key
  const vehicleTypes = [
    { key: 'suv', icon: <TbCarSuv size={32} />, href: '/inventory?body_type=suv' },
    { key: 'sedan', icon: <LuCar size={32} />, href: '/inventory?body_type=sedan' },
    { key: 'hatchback', icon: <PiCarSimpleBold size={32} />, href: '/inventory?body_type=hatchback' },
    { key: 'electric', icon: <HiOutlineLightningBolt size={32} />, href: '/inventory?fuel_type=electric' },
    { key: 'convertible', icon: <PiCarProfileBold size={32} />, href: '/inventory?body_type=convertible' },
    { key: 'hybrid', icon: <LuCarTaxiFront size={32} />, href: '/inventory?fuel_type=hybrid' },
    { key: 'coupe', icon: <LuCarFront size={32} />, href: '/inventory?body_type=coupe' },
    { key: 'van', icon: <PiVanBold size={32} />, href: '/inventory?body_type=van' },
  ];


  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Use translation for the title */}
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {vehicleTypes.map((type) => (
            <VehicleTypeCard
              key={type.key} // Use the key for React key prop
              icon={type.icon}
              // Use the translation hook to get the label based on the key
              label={t(`types.${type.key}`)}
              href={type.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
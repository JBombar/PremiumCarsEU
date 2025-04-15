// /app/sell/page.tsx
"use client";

import { CarSellForm } from "@/components/forms/CarSellForm";
import { FaThumbsUp, FaCarSide, FaMoneyBillWave, FaShieldAlt } from "react-icons/fa";
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function SellPage() {
  const t = useTranslations('SellPage'); // Initialize hook

  // Define keys and icons for benefits for easier mapping
  const benefitKeys = [
    {
      key: 'pricing',
      icon: <FaMoneyBillWave className="h-4 w-4 text-primary/70" />
    },
    {
      key: 'process',
      icon: <FaCarSide className="h-4 w-4 text-primary/70" />
    },
    {
      key: 'service',
      icon: <FaShieldAlt className="h-4 w-4 text-primary/70" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="text-center mb-12">
          {/* Use translated hero title */}
          <h1 className="text-4xl font-bold tracking-tight">{t('hero.title')}</h1>
          {/* Use translated hero subtitle */}
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mt-12">
          {/* Left column with benefits */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 px-4 py-6">
              {/* Use translated benefits title */}
              <h2 className="text-xl font-medium mb-8 text-muted-foreground">{t('benefits.title')}</h2>

              <div className="space-y-10">
                {/* Map over benefit keys */}
                {benefitKeys.map((benefit) => (
                  <div key={benefit.key} className="flex gap-4">
                    <div className="bg-primary/5 rounded-full p-2 h-fit">
                      {benefit.icon}
                    </div>
                    <div>
                      {/* Use translated benefit title */}
                      <h3 className="font-medium text-base text-muted-foreground">{t(`benefits.${benefit.key}.title`)}</h3>
                      {/* Use translated benefit description */}
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        {t(`benefits.${benefit.key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Trust Indicator */}
                <div className="bg-muted/30 p-4 rounded-lg mt-10">
                  <div className="flex gap-3 items-center">
                    <div className="bg-primary/5 rounded-full p-2">
                      <FaThumbsUp className="h-4 w-4 text-primary/70" />
                    </div>
                    <div>
                      {/* Use translated trust indicator title */}
                      <h3 className="font-medium text-sm text-muted-foreground">{t('trustIndicator.title')}</h3>
                      {/* Use translated trust indicator description */}
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {t('trustIndicator.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column with form */}
          <div className="lg:col-span-3">
            {/* Assuming CarSellForm will be translated separately */}
            <CarSellForm />
          </div>
        </div>
      </div>
    </div>
  );
}
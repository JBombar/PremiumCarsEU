// app/about/page.tsx
import Link from "next/link";
import Image from "next/image"; // Keep Image import if you plan to use actual images
import { Button } from "@/components/ui/button";
import {
  Building,
  Shield,
  Users,
  Sparkles,
  Heart
} from "lucide-react";
import { getTranslations } from 'next-intl/server'; // Import getTranslations

// Make the component async to use getTranslations
export default async function AboutPage() {
  // Initialize translation hooks for different sections
  const t = await getTranslations('AboutPage');
  const tNav = await getTranslations('Navbar'); // For reusing "Contact Us"

  // Define keys for values and team members for easier mapping
  const valueKeys = ['trust', 'transparency', 'innovation', 'customerFirst'];
  const valueIcons = {
    trust: <Shield className="h-8 w-8 text-primary" />,
    transparency: <Users className="h-8 w-8 text-primary" />,
    innovation: <Sparkles className="h-8 w-8 text-primary" />,
    customerFirst: <Heart className="h-8 w-8 text-primary" />,
  };
  const teamKeys = ['member1', 'member2', 'member3'];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/90 to-primary/70 text-white">
        <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
        <div className="relative container max-w-7xl mx-auto px-6 sm:px-8 py-24 md:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            {t('hero.title')}
          </h1>
          <p className="max-w-2xl mx-auto text-xl font-medium text-white/90">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            {t('story.title')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-md text-muted-foreground mb-6">{t('story.paragraph1')}</p>
              <p className="text-md text-muted-foreground mb-6">{t('story.paragraph2')}</p>
              <p className="text-md text-muted-foreground">{t('story.paragraph3')}</p>
            </div>
            <div className="order-1 lg:order-2 bg-muted rounded-xl overflow-hidden h-[400px] relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Building size={64} className="opacity-20" />
              </div>
              {/* Add Image component here if needed, using t('story.imageAlt') */}
              {/* <Image src="/images/about/our-story.jpg" alt={t('story.imageAlt')} fill className="object-cover" /> */}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            {t('values.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueKeys.map((key) => (
              <div key={key} className="bg-background rounded-lg p-8 text-center flex flex-col items-center shadow-sm">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  {/* Use the icon map */}
                  {valueIcons[key as keyof typeof valueIcons]}
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(`values.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`values.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            {t('team.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamKeys.map((key) => (
              <div key={key} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="h-64 bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Users size={48} className="opacity-20" />
                  </div>
                  {/* Add Image component here if needed, using t(`team.${key}.imageAlt`) */}
                  {/* <Image src={`/images/team/${key}.jpg`} alt={t(`team.${key}.imageAlt`)} fill className="object-cover" /> */}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1">{t(`team.${key}.name`)}</h3>
                  <p className="text-primary font-medium mb-4">{t(`team.${key}.title`)}</p>
                  <p className="text-muted-foreground italic">{t(`team.${key}.quote`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-muted">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          <Link href="/contact">
            <Button size="lg" className="px-8">
              {/* Reuse key from Navbar */}
              {tNav('links.contact')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
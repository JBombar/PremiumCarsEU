// src/components/layout/Footer.tsx
'use client';

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { useTranslations } from 'next-intl'; // Import useTranslations

export function Footer() {
  // Initialize hooks for different namespaces
  const tFooter = useTranslations('Footer');
  const tNav = useTranslations('Navbar'); // For reused links like Home, Contact

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black py-12 mt-auto text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4 pl-0 md:pl-4">
            <div className="font-bold text-xl">CarBiz</div> {/* Assuming 'CarBiz' is a brand name, not translated */}
            <p className="text-gray-400 max-w-xs">
              {tFooter('brand.slogan')}
            </p>
            <p className="text-sm text-gray-500 pt-4">
              {/* Pass dynamic values to the translation function */}
              {tFooter('brand.copyright', { year: currentYear })}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-base mb-4">{tFooter('quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tNav('links.home')} {/* Reusing key from Navbar */}
                </Link>
              </li>
              <li>
                <Link
                  href="/search" // Assuming /search route exists
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('quickLinks.search')}
                </Link>
              </li>
              <li>
                <Link
                  href="/#request-car-form"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tNav('links.requestCar')} {/* Reusing key from Navbar */}
                </Link>
              </li>
              <li>
                <Link
                  href="/new-cars" // Assuming /new-cars route exists
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('quickLinks.newCars')}
                </Link>
              </li>
              <li>
                <Link
                  href="/preowned" // Assuming /preowned route exists
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('quickLinks.preowned')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tNav('links.contact')} {/* Reusing key from Navbar */}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-medium text-base mb-4">{tFooter('supportLegal.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('supportLegal.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('supportLegal.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('supportLegal.faq')}
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {tFooter('supportLegal.customerSupport')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="font-medium text-base mb-4">{tFooter('contactUs.title')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4" />
                {/* Assuming phone number/email are not translated */}
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>contact@cardealer.com</span>
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">{tFooter('followUs.title')}</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={tFooter('followUs.socialAriaLabels.facebook')}
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={tFooter('followUs.socialAriaLabels.instagram')}
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={tFooter('followUs.socialAriaLabels.linkedIn')}
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
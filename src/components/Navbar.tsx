// src/components/Navbar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Hexagon, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Imports for language switching AND translation
import { useLocale, useTranslations } from 'next-intl'; // Added useTranslations
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Internationalization Hooks ---
  const currentLocale = useLocale();
  const router = useRouter();
  const tNav = useTranslations('Navbar');    // Hook for Navbar specific translations
  const tCommon = useTranslations('Common'); // Hook for common translations like Sign In/Register
  // --- End Internationalization Hooks ---

  const supportedLocales = ['en', 'de'];

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Modify navLinks: Use keys instead of hardcoded labels
  const navLinks = [
    { key: "home", href: "/" },
    { key: "requestCar", href: "#request-car-form" },
    { key: "sellCar", href: "/sell" },
    { key: "searchCars", href: "/inventory" },
    { key: "aboutUs", href: "/about" },
    { key: "contact", href: "/contact" },
  ];

  // Component for the language switcher dropdown content (remains the same)
  const LanguageSwitcherContent = () => (
    <>
      {supportedLocales.map((loc) => (
        <DropdownMenuItem key={loc} disabled={currentLocale === loc} onSelect={() => switchLocale(loc)}
          className={`${currentLocale === loc ? "font-semibold bg-muted" : ""} px-3 py-2 text-sm cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none`}
        >
          {loc.toUpperCase()}
        </DropdownMenuItem>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Hexagon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">CarBiz</span> {/* Keep Brand Name Untranslated */}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <ul className="flex items-center space-x-8">
            {/* Use tNav to translate link labels */}
            {navLinks.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} className="text-sm font-medium relative px-3 py-2 transition-all duration-300 group">
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                    {tNav(`links.${key}`)} {/* Use translation key */}
                  </span>
                  <span className="absolute inset-0 rounded-md bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-0"></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side: Language Dropdown, Auth, Mobile Toggle */}
        <div className="flex items-center space-x-3">
          {/* Avatar & Auth Buttons */}
          <Avatar className="h-8 w-8"><AvatarFallback></AvatarFallback></Avatar>
          <Link href="/login">
            {/* Use tCommon for button text */}
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">{tCommon('signIn')}</Button>
          </Link>
          <Link href="/register">
            {/* Use tCommon for button text */}
            <Button size="sm" className="hidden sm:inline-flex">{tCommon('register')}</Button>
          </Link>

          {/* Desktop Language Switcher Dropdown (moved after auth buttons) */}
          <div className="hidden sm:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs font-medium">
                  {currentLocale.toUpperCase()} <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="bg-background border border-border rounded-md shadow-md min-w-[80px] overflow-hidden"
              >
                <LanguageSwitcherContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button onClick={toggleMobileMenu} className="md:hidden p-2 focus:outline-none"
            // Use tNav for aria-label
            aria-label={isMobileMenuOpen ? tNav('mobileMenu.closeLabel') : tNav('mobileMenu.openLabel')}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-background border-b border-border/40 shadow-lg">
          <nav className="px-6 py-4">
            <ul className="space-y-4">
              {/* Mobile Nav Links */}
              {/* Use tNav to translate link labels */}
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="block text-sm font-medium py-2 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                    {tNav(`links.${key}`)} {/* Use translation key */}
                  </Link>
                </li>
              ))}

              {/* Mobile Language Switcher Dropdown */}
              <li className="pt-4 border-t border-border/40">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                      {/* Use tNav for prefix */}
                      <span>{tNav('languageSwitcher.labelPrefix')}{currentLocale.toUpperCase()}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width] bg-background border border-border rounded-md shadow-md overflow-hidden">
                    <LanguageSwitcherContent />
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>

              {/* Mobile Auth Buttons */}
              <li className="pt-4 border-t border-border/40">
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    {/* Use tCommon for button text */}
                    <Button variant="outline" size="sm" className="w-full">{tCommon('signIn')}</Button>
                  </Link>
                  <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    {/* Use tCommon for button text */}
                    <Button size="sm" className="w-full">{tCommon('register')}</Button>
                  </Link>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
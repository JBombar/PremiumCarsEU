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
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentLocale = useLocale();
  const router = useRouter();
  const tNav = useTranslations("Navbar");
  const tCommon = useTranslations("Common");

  const supportedLocales = ["en", "de", "fr", "it", "sk", "pl", "hu"];

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { key: "home", href: "/" },
    { key: "requestCar", href: "#request-car-form" },
    { key: "sellCar", href: "/sell" },
    { key: "searchCars", href: "/inventory" },
    { key: "aboutUs", href: "/about" },
    { key: "contact", href: "/contact" },
  ];

  const LanguageSwitcherContent = () => (
    <>
      {supportedLocales.map((loc) => (
        <DropdownMenuItem
          key={loc}
          disabled={currentLocale === loc}
          onSelect={() => switchLocale(loc)}
          className={`${currentLocale === loc ? "font-semibold bg-muted" : ""
            } px-3 py-2 text-sm cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none`}
        >
          {loc.toUpperCase()}
        </DropdownMenuItem>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-wrap items-center gap-y-2 h-auto min-h-16">
        {/* Logo */}
        <div className="flex items-center mr-4">
          <Link href="/" className="flex items-center space-x-2">
            <Hexagon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">PremiumCarsEU</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center min-w-0">
          <ul className="flex items-center justify-center gap-x-4 lg:gap-x-6 whitespace-nowrap overflow-hidden">
            {navLinks.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="relative text-sm font-medium px-3 py-2 rounded-md transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-white">
                    {tNav(`links.${key}`)}
                  </span>
                  <span className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out rounded-md bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center ml-auto space-x-3 shrink-0 max-w-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback />
          </Avatar>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex whitespace-nowrap"
            >
              {tCommon("signIn")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="hidden sm:inline-flex whitespace-nowrap">
              {tCommon("register")}
            </Button>
          </Link>

          {/* Language Switcher */}
          <div className="hidden sm:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-xs font-medium"
                >
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 focus:outline-none"
            aria-label={
              isMobileMenuOpen
                ? tNav("mobileMenu.closeLabel")
                : tNav("mobileMenu.openLabel")
            }
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-background border-b border-border/40 shadow-lg">
          <nav className="px-6 py-4">
            <ul className="space-y-4">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="block text-sm font-medium py-2 hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {tNav(`links.${key}`)}
                  </Link>
                </li>
              ))}

              {/* Mobile Language Switcher */}
              <li className="pt-4 border-t border-border/40">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex justify-between items-center"
                    >
                      <span>{tNav("languageSwitcher.labelPrefix")}{currentLocale.toUpperCase()}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[--radix-dropdown-menu-trigger-width] bg-background border border-border rounded-md shadow-md overflow-hidden"
                  >
                    <LanguageSwitcherContent />
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>

              {/* Mobile Auth Buttons */}
              <li className="pt-4 border-t border-border/40">
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      {tCommon("signIn")}
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    className="w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button size="sm" className="w-full">
                      {tCommon("register")}
                    </Button>
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

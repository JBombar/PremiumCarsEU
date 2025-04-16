// src/i18n/request.ts

import { cookies } from 'next/headers'; // Import cookies
import { getRequestConfig } from 'next-intl/server';

// Define your supported locales and a default locale
const SUPPORTED_LOCALES = ['en', 'de', 'fr', "it", 'sk', 'pl', 'hu']; // Add any other locales you support
const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
    // Read the locale from the NEXT_LOCALE cookie
    let locale = cookies().get('NEXT_LOCALE')?.value || DEFAULT_LOCALE;

    // Optional: Validate if the cookie locale is supported, fallback if not
    if (!SUPPORTED_LOCALES.includes(locale)) {
        console.warn(`Unsupported locale "${locale}" found in cookie. Falling back to ${DEFAULT_LOCALE}.`);
        locale = DEFAULT_LOCALE;
    }

    let messages;
    try {
        // Load messages for the determined locale
        messages = (await import(`../../messages/${locale}.json`)).default;
    } catch (error) {
        console.error(`Could not load messages for locale "${locale}":`, error);
        // Fallback to default locale messages if current locale's messages fail to load
        console.warn(`Falling back to messages for default locale "${DEFAULT_LOCALE}".`);
        locale = DEFAULT_LOCALE; // Ensure locale variable matches the fallback messages
        messages = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default;
    }

    return {
        locale,
        messages: messages
    };
});
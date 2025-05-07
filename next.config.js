const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'methxgrrgzpmkucfrfhg.supabase.co', // Replace with your Supabase storage domain
                pathname: '/storage/v1/object/public/**', // Adjust the path based on your storage bucket structure
            },
        ],
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,

        N8N_AI_INTENT_WEBHOOK: process.env.N8N_AI_INTENT_WEBHOOK,
        N8N_INGEST_API_KEY: process.env.N8N_INGEST_API_KEY,
        N8N_SHARE_LISTINGS_WEBHOOK_URL: process.env.N8N_SHARE_LISTINGS_WEBHOOK_URL,
        N8N_SHARE_OFFERS_WEBHOOK_URL: process.env.N8N_SHARE_OFFERS_WEBHOOK_URL,
        N8N_PARTNER_SHARES_WEBHOOK_URL: process.env.N8N_PARTNER_SHARES_WEBHOOK_URL,
        N8N_LEAD_SHARES_WEBHOOK_URL: process.env.N8N_LEAD_SHARES_WEBHOOK_URL,

        WHATSAPP_BOT_PARTNER_ID: process.env.WHATSAPP_BOT_PARTNER_ID,
    },
};

module.exports = withNextIntl(nextConfig);

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
        N8N_AI_INTENT_WEBHOOK: process.env.N8N_AI_INTENT_WEBHOOK, // Expose the n8n webhook to server-side runtime
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    },
};

module.exports = withNextIntl(nextConfig);

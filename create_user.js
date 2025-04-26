// create_user.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config() // if you’re using a .env file

const supabase = createClient(
    'https://methxgrrgzpmkucfrfhg.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Creates a new user in Supabase Auth.
 * 
 * @param {Object} userData
 * @param {string} userData.email       — the user’s email
 * @param {string} userData.password    — the user’s password
 * @param {boolean} userData.email_confirm  — whether to auto‑confirm their email
 * @param {Object} [userData.user_metadata] — any extra metadata
 */
async function createUser({ email, password, email_confirm = false, user_metadata = {} }) {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm,
        user_metadata,
    })

    if (error) {
        console.error('❌ Error creating user:', error.message)
        process.exit(1)
    } else {
        console.log('✅ User created:', data.id)
        console.log('   email:', data.email)
        process.exit(0)
    }
}

// === MAIN ===
// Replace these with the real values for your automation user:
const NEW_USER = {
    email: 'whatsapp-bot@premiumcarseu.com',
    password: 'SuperSecureP@ssw0rd!',
    email_confirm: true,           // skip the confirmation email
    user_metadata: { role: 'bot' } // optional, if you track roles
}

createUser(NEW_USER)

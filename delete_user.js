const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://methxgrrgzpmkucfrfhg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldGh4Z3JyZ3pwbWt1Y2ZyZmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQxNzg2MSwiZXhwIjoyMDU4OTkzODYxfQ.dLwcidZPAcqW_yjZWYprxM52aFG_-Urp67UwEZj15fw' // 🔐 use .env in real apps
)

async function deleteUserById(userId) {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
        console.error('❌ Error deleting user:', error.message)
    } else {
        console.log('✅ User deleted:', userId)
    }
}

deleteUserById('bb065ddc-fdd8-4580-a100-54e67afd6954') // 👈 put actual user ID here

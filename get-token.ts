import 'dotenv/config'; // 👈 this loads your .env file
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'swisspremiumauto@gmail.com',
    password: 'SupaBaseAdventure2274!',
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    return;
  }

  console.log('✅ Access Token:', data.session?.access_token);
}

login();

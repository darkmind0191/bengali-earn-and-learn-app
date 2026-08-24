import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kynofrgyachmhmsylqqw.supabase.co';
const supabaseAnonKey = 'sb_publishable_c2cvWOIP5hWB8ZV5E7ir0A_WEEFZtCI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
// Lê URL e chave do .env (Vite expõe via import.meta.env.VITE_*).
// Não commitar o .env real; .env.example tem placeholders.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL não definido. Configure em .env (ver .env.example).');
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY não definido. Configure em .env (ver .env.example).');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

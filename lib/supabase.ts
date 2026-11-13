import { createClient } from "@supabase/supabase-js";

// De koppeling tussen Vercel en Supabase zet deze variabelen automatisch.
// Supabase kent twee namen voor de openbare sleutel: de nieuwe
// "publishable key" en de oudere "anon key". Beide werken.
export function supabaseInstellingen() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, sleutel };
}

// Client met de openbare sleutel. Wat hiermee gelezen en geschreven mag
// worden, bepalen de toegangsregels (Row Level Security) in Supabase.
export function maakSupabaseClient() {
  const { url, sleutel } = supabaseInstellingen();
  if (!url || !sleutel) return null;
  return createClient(url, sleutel, {
    auth: { persistSession: false },
  });
}

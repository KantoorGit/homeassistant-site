import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseInstellingen } from "./supabase";

// Client voor de ingelogde bezoeker; de sessie staat in cookies van
// Supabase. Wat deze client mag, bepalen de toegangsregels in Supabase.
export async function maakServerClient() {
  const { url, sleutel } = supabaseInstellingen();
  if (!url || !sleutel) return null;
  const cookieStore = await cookies();

  return createServerClient(url, sleutel, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(teZetten) {
        try {
          for (const { name, value, options } of teZetten) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In een Server Component kunnen geen cookies worden gezet. Dat is
          // geen probleem: proxy.ts vernieuwt de sessie bij elk verzoek.
        }
      },
    },
  });
}

// Client met de geheime serversleutel. Omzeilt alle toegangsregels en is
// alleen bedoeld voor herstelcodes en het resetten van 2FA. Nooit gebruiken
// met invoer die niet eerst aan een ingelogde gebruiker is gekoppeld.
export function maakBeheerClient() {
  const { url } = supabaseInstellingen();
  const geheim =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !geheim) return null;
  return createClient(url, geheim, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

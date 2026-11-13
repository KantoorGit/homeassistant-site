import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseInstellingen } from "@/lib/supabase";

// Supabase-client met de inlogsessie van de bezoeker (in cookies).
// Alles wat hiermee gelezen of geschreven wordt, valt onder de
// toegangsregels voor de ingelogde gebruiker (supabase/003_beheer.sql).
export async function maakSessieClient() {
  // Eerst de cookies lezen: daarmee weet Next.js dat deze pagina per
  // verzoek wordt opgebouwd (en niet vooraf, zonder sessie).
  const cookieOpslag = await cookies();
  const { url, sleutel } = supabaseInstellingen();
  if (!url || !sleutel) {
    throw new Error("Supabase-variabelen ontbreken in de omgeving.");
  }
  return createServerClient(url, sleutel, {
    cookies: {
      getAll() {
        return cookieOpslag.getAll();
      },
      setAll(teZetten) {
        try {
          for (const { name, value, options } of teZetten) {
            cookieOpslag.set(name, value, options);
          }
        } catch {
          // Vanuit een pagina kunnen geen cookies gezet worden; de proxy
          // (proxy.ts) ververst de sessie al vóór elke beheerpagina.
        }
      },
    },
  });
}

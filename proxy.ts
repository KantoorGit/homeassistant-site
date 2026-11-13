import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Draait vóór elke pagina (website, accountschermen, forum en /beheer).
// Heeft de bezoeker een Supabase-sessie, dan wordt die hier gecontroleerd en
// zo nodig vernieuwd, zodat pagina's altijd een geldige sessie zien.
// Bezoekers zonder sessie merken er niets van.
export async function proxy(request: NextRequest) {
  let antwoord = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const heeftSessie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!url || !sleutel || !heeftSessie) return antwoord;

  const supabase = createServerClient(url, sleutel, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(teZetten, headers) {
        for (const { name, value } of teZetten) {
          request.cookies.set(name, value);
        }
        antwoord = NextResponse.next({ request });
        for (const { name, value, options } of teZetten) {
          antwoord.cookies.set(name, value, options);
        }
        // Voorkomt dat een tussenliggende cache de sessie van de ene
        // bezoeker aan een andere geeft.
        for (const [sleutelNaam, waarde] of Object.entries(headers ?? {})) {
          antwoord.headers.set(sleutelNaam, waarde);
        }
      },
    },
  });

  // Controleert het token en vernieuwt het als het bijna verlopen is.
  await supabase.auth.getClaims();
  return antwoord;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

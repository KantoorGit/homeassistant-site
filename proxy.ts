import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { beheerTaalCookie } from "./lib/beheer/teksten";
import { isTaal, standaardTaal, taalCookie, talen, type Taal } from "./lib/site";

// Taal voor het kale adres "/": eerst de onthouden keuze (cookie), anders
// de voorkeurstalen van de browser, anders Nederlands (W-TAAL-05).
function kiesTaal(request: NextRequest): Taal {
  const onthouden = request.cookies.get(taalCookie)?.value;
  if (isTaal(onthouden)) return onthouden;
  const voorkeur = request.headers.get("accept-language") ?? "";
  const kandidaten = voorkeur
    .split(",")
    .map((deel) => {
      const [code, ...rest] = deel.trim().split(";");
      const q = rest.find((r) => r.trim().startsWith("q="));
      return { code: code.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((k) => k.code && k.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { code } of kandidaten) {
    const basis = code.split("-")[0];
    if ((talen as readonly string[]).includes(basis)) return basis as Taal;
  }
  return standaardTaal;
}

// Draait vóór elke pagina (website, accountschermen, forum en /beheer).
// Heeft de bezoeker een Supabase-sessie, dan wordt die hier gecontroleerd en
// zo nodig vernieuwd, zodat pagina's altijd een geldige sessie zien.
// Bezoekers zonder sessie merken er niets van.
export async function proxy(request: NextRequest) {
  // Beheerpaneel geopend met ?taal=… (vanaf de website of de taalkiezer in
  // het beheerpaneel): de taal onthouden en door naar het adres zonder
  // ?taal (W-ADM-20).
  const beheerTaal = request.nextUrl.searchParams.get("taal");
  if (request.nextUrl.pathname.startsWith("/beheer") && isTaal(beheerTaal)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("taal");
    const doorsturen = NextResponse.redirect(url, 303);
    doorsturen.cookies.set(beheerTaalCookie, beheerTaal, {
      path: "/beheer",
      maxAge: 31536000,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
    doorsturen.headers.set("Cache-Control", "private, no-store");
    return doorsturen;
  }

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${kiesTaal(request)}`;
    const doorsturen = NextResponse.redirect(url, 307);
    // Per bezoeker verschillend: niet tussen bezoekers delen.
    doorsturen.headers.set("Vary", "Cookie, Accept-Language");
    doorsturen.headers.set("Cache-Control", "private, no-store");
    return doorsturen;
  }

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

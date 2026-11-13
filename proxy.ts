import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Ververst de inlogsessie (Supabase) vóór elke pagina van het beheerpaneel,
// zodat een verlopen toegangsbewijs op tijd wordt vernieuwd.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !sleutel) return NextResponse.next();

  let antwoord = NextResponse.next({ request });
  const supabase = createServerClient(url, sleutel, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(teZetten) {
        for (const { name, value } of teZetten) {
          request.cookies.set(name, value);
        }
        antwoord = NextResponse.next({ request });
        for (const { name, value, options } of teZetten) {
          antwoord.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return antwoord;
}

export const config = {
  matcher: ["/beheer/:pad*"],
};

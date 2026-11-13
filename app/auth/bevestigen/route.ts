import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { taalUitPad, veiligPad } from "@/lib/paden";
import { maakServerClient } from "@/lib/supabase-server";

// Hier komen de links uit de e-mails van Supabase op uit: bevestiging van
// het e-mailadres en wachtwoord vergeten. De link wordt omgezet in een
// sessie, daarna gaat de bezoeker door naar 'volgende'.
export async function GET(request: NextRequest) {
  const zoek = request.nextUrl.searchParams;
  const volgende = veiligPad(zoek.get("volgende"), "/nl/account");
  const taal = taalUitPad(volgende);
  const mislukt = new URL(`/${taal}/account/login?melding=link-ongeldig`, request.url);

  const supabase = await maakServerClient();
  if (!supabase) return NextResponse.redirect(mislukt);

  const code = zoek.get("code");
  const tokenHash = zoek.get("token_hash");
  const type = zoek.get("type") as EmailOtpType | null;

  let gelukt = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    gelukt = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    gelukt = !error;
  }

  return NextResponse.redirect(gelukt ? new URL(volgende, request.url) : mislukt);
}

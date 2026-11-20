// Content-Security-Policy van de site (W-SEC-12, beveiligingsronde 1).
//
// De browser voert alleen scripts uit van de eigen site en van Cloudflare
// Turnstile (botcontrole), toont frames alleen van YouTube (nocookie), Vimeo,
// Dailymotion en Turnstile, en praat alleen met de eigen site en de eigen
// Supabase. Plug-ins, een andere <base> en formulieren naar andere sites zijn
// verboden, en de site mag niet in een frame van een andere site staan.
//
// Waarom nog 'unsafe-inline' bij scripts: de site gebruikt Cache Components
// (vooraf opgebouwde pagina's). Next.js zet daarin kleine scripts in de pagina
// zelf. Een nonce zou elke pagina bij elk bezoek opnieuw laten opbouwen en
// werkt niet samen met vooraf opgebouwde pagina's (zie de CSP-gids van
// Next.js). Scripts van andere sites blijven wel geblokkeerd, en tekst van
// bezoekers wordt altijd als platte tekst getoond (W-SEC-13).
//
// Afbeeldingen en video mogen van elke https-site komen, omdat de redactie
// naar een foto of videobestand op internet kan linken (W-ADM-18, -19).

type Omgeving = {
  /** next dev: React heeft dan eval nodig, en de ontwikkelserver een websocket. */
  ontwikkeling: boolean;
  /** Vercel-preview: de Vercel Toolbar laadt dan van vercel.live. */
  preview: boolean;
  /** NEXT_PUBLIC_SUPABASE_URL; zonder waarde: elk Supabase-project. */
  supabaseUrl?: string;
};

const turnstile = "https://challenges.cloudflare.com";

function oorsprong(adres: string | undefined): string | undefined {
  if (!adres) return undefined;
  try {
    const url = new URL(adres);
    return url.protocol === "https:" ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

export function maakCsp({ ontwikkeling, preview, supabaseUrl }: Omgeving): string {
  const supabase = oorsprong(supabaseUrl) ?? "https://*.supabase.co";
  const toolbar = preview ? ["https://vercel.live"] : [];

  const regels: [string, string[]][] = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      ["'self'", "'unsafe-inline'", turnstile, ...toolbar, ...(ontwikkeling ? ["'unsafe-eval'"] : [])],
    ],
    ["style-src", ["'self'", "'unsafe-inline'", ...toolbar]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    ["media-src", ["'self'", "blob:", "https:"]],
    ["font-src", ["'self'", ...(preview ? ["https://vercel.live", "https://assets.vercel.com"] : [])]],
    [
      "connect-src",
      [
        "'self'",
        supabase,
        turnstile,
        ...(preview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : []),
        ...(ontwikkeling ? ["ws:"] : []),
      ],
    ],
    [
      "frame-src",
      [
        "https://www.youtube-nocookie.com",
        "https://player.vimeo.com",
        "https://www.dailymotion.com",
        turnstile,
        ...toolbar,
      ],
    ],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  const tekst = regels.map(([naam, bronnen]) => `${naam} ${bronnen.join(" ")}`);
  if (!ontwikkeling) tekst.push("upgrade-insecure-requests");
  return tekst.join("; ");
}

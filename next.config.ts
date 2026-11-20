import type { NextConfig } from "next";
import { maakCsp } from "./lib/csp";
import { zoekmachinesToelaten } from "./lib/site";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Het kale adres "/" stuurt proxy.ts door naar de taal van de bezoeker.
  // Zolang de site in opbouw is, krijgt elk antwoord de aanwijzing dat
  // zoekmachines het niet mogen opnemen (schakelaar in lib/site.ts).
  async headers() {
    // Beveiligingsheaders op elke pagina (W-ACC-07, W-SEC-12): alleen HTTPS,
    // een Content-Security-Policy (zie lib/csp.ts), niet in een frame van een
    // andere site, geen raden naar bestandstypes, geen gedeeld venster met
    // andere sites, en geen toegang tot camera, microfoon of locatie.
    // De omgeving wordt bij het bouwen vastgelegd (VERCEL_ENV bestaat dan al).
    const csp = maakCsp({
      ontwikkeling: process.env.NODE_ENV === "development",
      preview: process.env.VERCEL_ENV === "preview",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    const beveiliging = [
      {
        // "preload" maakt aanmelden bij de HSTS-preloadlijst mogelijk;
        // dat aanmelden zelf is een aparte, bewuste stap (zie het bouwplan).
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: csp },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
    ];
    const zoekmachines = zoekmachinesToelaten
      ? []
      : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [{ source: "/:pad*", headers: [...beveiliging, ...zoekmachines] }];
  },
};

export default nextConfig;

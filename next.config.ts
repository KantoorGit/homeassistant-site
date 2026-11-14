import type { NextConfig } from "next";
import { zoekmachinesToelaten } from "./lib/site";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Het kale adres "/" stuurt proxy.ts door naar de taal van de bezoeker.
  // Zolang de site in opbouw is, krijgt elk antwoord de aanwijzing dat
  // zoekmachines het niet mogen opnemen (schakelaar in lib/site.ts).
  async headers() {
    // Beveiligingsheaders op elke pagina (W-ACC-07): alleen HTTPS, niet in
    // een frame van een andere site, geen raden naar bestandstypes, en geen
    // toegang tot camera, microfoon of locatie.
    const beveiliging = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
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

import type { NextConfig } from "next";
import { zoekmachinesToelaten } from "./lib/site";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Het kale adres verwijst naar de Nederlandse voorpagina.
  async redirects() {
    return [{ source: "/", destination: "/nl", permanent: false }];
  },
  // Zolang de site in opbouw is, krijgt elk antwoord de aanwijzing dat
  // zoekmachines het niet mogen opnemen (schakelaar in lib/site.ts).
  async headers() {
    if (zoekmachinesToelaten) return [];
    return [
      {
        source: "/:pad*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

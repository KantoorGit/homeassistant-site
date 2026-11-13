import type { MetadataRoute } from "next";
import { zoekmachinesToelaten } from "@/lib/site";

// robots.txt: zolang de site in opbouw is, sluit dit de hele site af voor
// zoekmachines (schakelaar in lib/site.ts).
export default function robots(): MetadataRoute.Robots {
  if (!zoekmachinesToelaten) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" } };
}

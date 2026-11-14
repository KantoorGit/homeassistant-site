"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  bannerVersie,
  bezoekerCookie,
  bezoekerCookieDagen,
  metingAdres,
  toestemmingCookie,
} from "@/lib/meting/instellingen";
import { bannerTeksten } from "@/lib/meting/teksten";
import type { Taal } from "@/lib/site";

// Cookiebanner (W-ANA-70, -71): Accepteren en Weigeren even groot, niets
// vooraf aangevinkt, de site blijft bruikbaar zonder keuze. Via de link
// "Cookie-instellingen" in de voettekst is de keuze altijd te wijzigen.

const openEvent = "cookie-instellingen";

function leesCookie(naam: string): string | null {
  const deel = document.cookie.split("; ").find((c) => c.startsWith(`${naam}=`));
  return deel ? decodeURIComponent(deel.slice(naam.length + 1)) : null;
}

function zetCookie(naam: string, waarde: string, dagen: number) {
  document.cookie = `${naam}=${encodeURIComponent(waarde)}; path=/; max-age=${dagen * 86400}; samesite=lax; secure`;
}

function wisCookie(naam: string) {
  document.cookie = `${naam}=; path=/; max-age=0; samesite=lax; secure`;
}

function nieuweBezoekerscode(): string {
  return crypto.randomUUID();
}

export function openCookieInstellingen() {
  window.dispatchEvent(new Event(openEvent));
}

type Keuze = "ja" | "nee" | null;

export default function Cookiebanner({ taal }: { taal: Taal }) {
  const t = bannerTeksten[taal];
  const [open, zetOpen] = useState(false);
  const [keuze, zetKeuze] = useState<Keuze>(null);
  const [gpc, zetGpc] = useState(false);

  useEffect(() => {
    const opgeslagen = leesCookie(toestemmingCookie);
    const [k, versie] = (opgeslagen ?? "").split(".");
    const geldig = (k === "ja" || k === "nee") && versie === bannerVersie;
    const metGpc =
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    // Toestand uit cookies en browser pas na het laden lezen (geen verschil
    // tussen server en browser).
    /* eslint-disable react-hooks/set-state-in-effect */
    zetGpc(metGpc);
    zetKeuze(geldig ? (k as Keuze) : null);
    // Met Global Privacy Control geldt "Weigeren"; de banner blijft weg.
    if (!geldig && !metGpc) zetOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (metGpc) wisCookie(bezoekerCookie);

    const openen = () => zetOpen(true);
    window.addEventListener(openEvent, openen);
    return () => window.removeEventListener(openEvent, openen);
  }, []);

  function kies(nieuw: "ja" | "nee") {
    zetCookie(toestemmingCookie, `${nieuw}.${bannerVersie}`, bezoekerCookieDagen);
    if (nieuw === "ja") {
      if (!leesCookie(bezoekerCookie)) {
        zetCookie(bezoekerCookie, nieuweBezoekerscode(), bezoekerCookieDagen);
      }
    } else {
      // Intrekken: de bezoekerscode verdwijnt direct.
      wisCookie(bezoekerCookie);
    }
    zetKeuze(nieuw);
    zetOpen(false);
    fetch(metingAdres, {
      method: "POST",
      body: JSON.stringify({
        toestemming: { keuze: nieuw === "ja" ? "accepteren" : "weigeren", versie: bannerVersie },
      }),
      keepalive: true,
    }).catch(() => {});
  }

  if (!open) return null;

  return (
    <section className="cookiebanner" role="region" aria-labelledby="cookiebanner-titel" lang={taal === "zh" ? "zh-Hans" : taal}>
      <div className="cookiebanner-inhoud">
        <h2 id="cookiebanner-titel">{t.titel}</h2>
        <p>{t.uitleg}</p>
        {gpc && <p className="cookiebanner-gpc">{t.gpc}</p>}
        {keuze && (
          <p>
            {t.huidigeKeuze} <strong>{keuze === "ja" ? t.geaccepteerd : t.geweigerd}</strong>
          </p>
        )}
        <p>
          <Link href={`/${taal}/privacy`}>{t.meerInfo}</Link>
        </p>
        <div className="cookiebanner-knoppen">
          <button type="button" onClick={() => kies("ja")} disabled={gpc} data-meting-naam="cookie-accepteren">
            {t.accepteren}
          </button>
          <button type="button" onClick={() => kies("nee")} data-meting-naam="cookie-weigeren">
            {t.weigeren}
          </button>
        </div>
      </div>
    </section>
  );
}

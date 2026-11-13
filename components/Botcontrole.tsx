"use client";

import { useEffect, useRef } from "react";

// Botbescherming met Cloudflare Turnstile (W-ACC-06). Alleen actief als de
// variabele NEXT_PUBLIC_TURNSTILE_SITE_KEY is ingesteld; Supabase controleert
// het antwoord als "CAPTCHA protection" in Supabase aan staat.
// 'ververs' verandert na elke poging, zodat er een nieuwe controle komt.

type Turnstile = {
  render: (el: HTMLElement, opties: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const scriptUrl =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function laadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const bestaand = document.querySelector<HTMLScriptElement>(
    `script[src="${scriptUrl}"]`,
  );
  return new Promise((klaar) => {
    const script = bestaand ?? document.createElement("script");
    script.addEventListener("load", () => klaar());
    if (!bestaand) {
      script.src = scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.turnstile) klaar();
  });
}

export default function Botcontrole({
  taal,
  ververs,
}: {
  taal: string;
  ververs?: unknown;
}) {
  const sleutel = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const plek = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sleutel || !plek.current) return;
    let id: string | undefined;
    let actief = true;
    laadScript().then(() => {
      if (!actief || !plek.current || !window.turnstile) return;
      id = window.turnstile.render(plek.current, {
        sitekey: sleutel,
        language: taal,
      });
    });
    return () => {
      actief = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [sleutel, taal, ververs]);

  if (!sleutel) return null;
  return <div ref={plek} className="botcontrole" />;
}

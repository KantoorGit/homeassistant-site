"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef } from "react";
import {
  metingAdres,
  schoonPad,
  type Gebeurtenis,
  type Verzending,
} from "@/lib/meting/instellingen";
import { isTaal, vindCategorie, type Taal } from "@/lib/site";

// Meetscript (hoofdstuk 10, W-ANA-30 t/m -39). Klein en op de achtergrond:
// gebeurtenissen gaan in een wachtrij en worden in één keer verstuurd.
// Op basisniveau zet dit script geen cookie en bewaart het niets in de
// browser. Faalt het versturen, dan merkt de bezoeker daar niets van.

const wachtrij: Gebeurtenis[] = [];
// Laadsnelheid: laatste waarde per meting, verstuurd bij het verlaten of
// verbergen van de pagina.
const snelheid = new Map<string, Gebeurtenis>();
const snelheidVerstuurd = new Map<string, number | undefined>();

// Core Web Vitals gaan over het laden van het document: ze horen bij de
// pagina waarop de bezoeker binnenkwam. Een vaste functie, zodat er maar één
// keer wordt aangemeld.
const laadPad = typeof location === "undefined" ? "" : schoonPad(location.pathname);

function meldSnelheid(m: { id: string; name: string; value: number }) {
  if (m.name !== "LCP" && m.name !== "INP" && m.name !== "CLS") return;
  const waarde = m.name === "CLS" ? Math.round(m.value * 1000) / 1000 : Math.round(m.value);
  // Eén waarde per soort meting per document: de laatste telt.
  snelheid.set(m.name, { type: "snelheid", naam: m.name, waarde, pad: laadPad });
}

function snelheidInWachtrij() {
  for (const [naam, g] of snelheid) {
    // Elke soort meting één keer versturen; LCP en CLS liggen vast zodra de
    // pagina voor het eerst verborgen of verlaten wordt.
    if (snelheidVerstuurd.has(naam)) continue;
    snelheidVerstuurd.set(naam, g.waarde);
    wachtrij.push(g);
  }
  snelheid.clear();
}
let herkomstMeesturen = true;
let taalVanSite: Taal = "nl";

function isAutomaat(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

function verstuur() {
  if (wachtrij.length === 0 || isAutomaat()) return;
  const gebeurtenissen = wachtrij.splice(0, 100);
  const verzending: Verzending = {
    sitetaal: taalVanSite,
    scherm: `${screen.width}x${screen.height}`,
    venster: `${innerWidth}x${innerHeight}`,
    browsertaal: navigator.language,
    gebeurtenissen,
  };
  if (herkomstMeesturen) {
    const zoek = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    for (const k of ["source", "medium", "campaign", "term", "content"]) {
      const w = zoek.get(`utm_${k}`);
      if (w) utm[k] = w.slice(0, 200);
    }
    verzending.herkomst = { verwijzer: document.referrer, utm };
    herkomstMeesturen = false;
  }
  const lichaam = JSON.stringify(verzending);
  try {
    if (navigator.sendBeacon?.(metingAdres, new Blob([lichaam], { type: "text/plain" }))) return;
  } catch {
    // val terug op fetch
  }
  fetch(metingAdres, { method: "POST", body: lichaam, keepalive: true }).catch(() => {});
}

export function meet(g: Gebeurtenis) {
  wachtrij.push(g);
  if (wachtrij.length >= 20) verstuur();
}

type Pagina = {
  pad: string;
  paginatype: string;
  categorie?: string;
  artikel_id?: string;
};

function bepaalPagina(pad: string): Pagina {
  const delen = pad.split("/").filter(Boolean);
  const taal = isTaal(delen[0]) ? delen[0] : "nl";
  const rest = delen.slice(1);
  const artikel = document.querySelector<HTMLElement>("[data-meting-artikel]");
  const basis = { pad: schoonPad(pad) };
  if (document.querySelector("[data-meting-404]")) return { ...basis, paginatype: "404" };
  if (rest.length === 0) return { ...basis, paginatype: "voorpagina" };
  if (rest[0] === "forum") return { ...basis, paginatype: "forum", categorie: "forum" };
  if (rest[0] === "account") return { ...basis, paginatype: "account" };
  if (rest[0] === "privacy") return { ...basis, paginatype: "privacy" };
  const categorie = vindCategorie(taal, rest[0]);
  if (!categorie) return { ...basis, paginatype: "overig" };
  if (rest.length === 1) return { ...basis, paginatype: "categorie", categorie: categorie.id };
  return {
    ...basis,
    paginatype: categorie.id === "training" ? "training" : "artikel",
    categorie: categorie.id,
    artikel_id: artikel?.dataset.metingArtikel,
  };
}

// Plek op de pagina van een klik (W-ANA-32).
function plekVan(el: Element): string {
  const eigen = el.closest<HTMLElement>("[data-meting-plek]")?.dataset.metingPlek;
  if (eigen) return eigen;
  if (el.closest(".categoriebalk")) return "categoriebalk";
  if (el.closest(".cookiebanner")) return "cookiebanner";
  if (el.closest(".taalkiezer")) return "taalkiezer";
  if (el.closest(".kop")) return "kop";
  if (el.closest(".voet")) return "voettekst";
  if (el.closest("article")) return "artikel";
  if (el.closest("form")) return "formulier";
  return "pagina";
}

export default function Meting({ taal }: { taal: Taal }) {
  const pad = usePathname();
  const huidig = useRef<Pagina | null>(null);
  const actief = useRef({ sinds: 0, opgeteld: 0 });
  const scroll = useRef(new Set<number>());

  useEffect(() => {
    taalVanSite = taal;
  }, [taal]);

  // Laadsnelheid (W-ANA-39).
  useReportWebVitals(meldSnelheid);

  // Actieve tijd van de vorige pagina afsluiten (W-ANA-31).
  function sluitTijd() {
    const p = huidig.current;
    if (!p) return;
    const a = actief.current;
    const totaal = a.opgeteld + (a.sinds ? Date.now() - a.sinds : 0);
    if (totaal >= 1000) meet({ type: "tijd", pad: p.pad, waarde: totaal });
    actief.current = { sinds: document.visibilityState === "visible" ? Date.now() : 0, opgeteld: 0 };
  }

  // Paginaweergave bij elke nieuwe pagina (W-ANA-30).
  useEffect(() => {
    if (pad.startsWith("/beheer")) return;
    sluitTijd();
    snelheidInWachtrij();
    scroll.current = new Set();
    const timer = setTimeout(() => {
      const pagina = bepaalPagina(pad);
      huidig.current = pagina;
      actief.current = {
        sinds: document.visibilityState === "visible" ? Date.now() : 0,
        opgeteld: 0,
      };
      meet({ type: "pagina", taal, ...pagina });
      if (pagina.paginatype === "404") {
        let verwijzer = "";
        try {
          verwijzer = document.referrer ? new URL(document.referrer).host : "";
        } catch {
          verwijzer = "";
        }
        meet({ type: "404", pad: pagina.pad, naam: verwijzer || undefined });
      }
      verstuur();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad]);

  // Zichtbaarheid, verlaten van de pagina en regelmatig versturen.
  useEffect(() => {
    function zichtbaarheid() {
      const a = actief.current;
      if (document.visibilityState === "hidden") {
        snelheidInWachtrij();
        if (a.sinds) a.opgeteld += Date.now() - a.sinds;
        a.sinds = 0;
        // Bij verbergen de tijd tot nu toe meesturen; daarna verder tellen.
        const p = huidig.current;
        if (p && a.opgeteld >= 1000) {
          meet({ type: "tijd", pad: p.pad, waarde: a.opgeteld });
          a.opgeteld = 0;
        }
        verstuur();
      } else if (!a.sinds) {
        a.sinds = Date.now();
      }
    }
    document.addEventListener("visibilitychange", zichtbaarheid);
    const verlaten = () => {
      snelheidInWachtrij();
      verstuur();
    };
    window.addEventListener("pagehide", verlaten);
    const interval = setInterval(verstuur, 10_000);
    return () => {
      document.removeEventListener("visibilitychange", zichtbaarheid);
      window.removeEventListener("pagehide", verlaten);
      clearInterval(interval);
    };
  }, []);

  // Klikken op kaarten, menu, taalkiezer, knoppen en uitgaande links.
  useEffect(() => {
    function klik(e: MouseEvent) {
      const doel = (e.target as Element | null)?.closest?.("a, button, [data-meting-klik]");
      if (!doel) return;
      const plek = plekVan(doel);
      let naam = "";
      if (doel instanceof HTMLAnchorElement && doel.href) {
        try {
          const u = new URL(doel.href);
          naam = u.host === location.host ? schoonPad(u.pathname) : `uit:${u.host}`;
        } catch {
          naam = "";
        }
        const naarTaal = doel.dataset.metingTaal;
        if (naarTaal && naarTaal !== taalVanSite) {
          meet({ type: "taal", taal: taalVanSite, naam: naarTaal, pad: huidig.current?.pad });
        }
      } else {
        naam =
          (doel as HTMLElement).dataset.metingNaam ??
          (doel.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      }
      meet({ type: "klik", pad: huidig.current?.pad, plek, naam });
    }
    document.addEventListener("click", klik, { capture: true });
    return () => document.removeEventListener("click", klik, { capture: true });
  }, []);

  // Scrolldiepte en trainingsstappen (W-ANA-33, -35).
  useEffect(() => {
    function scrollen() {
      const p = huidig.current;
      const artikel = document.querySelector<HTMLElement>("[data-meting-artikel]");
      if (!p || !artikel || p.pad !== schoonPad(location.pathname)) return;
      const vak = artikel.getBoundingClientRect();
      const gelezen = (innerHeight - vak.top) / Math.max(vak.height, 1);
      for (const drempel of [25, 50, 75, 100]) {
        if (gelezen * 100 >= drempel && !scroll.current.has(drempel)) {
          scroll.current.add(drempel);
          meet({ type: "scroll", pad: p.pad, artikel_id: p.artikel_id, waarde: drempel });
          if (drempel === 100 && p.paginatype === "training") {
            meet({ type: "training", pad: p.pad, naam: "afgerond" });
          }
        }
      }
      for (const stap of document.querySelectorAll<HTMLElement>("[data-meting-stap]")) {
        const naam = `stap ${stap.dataset.metingStap}`;
        if (scroll.current.has(-Number(stap.dataset.metingStap))) continue;
        if (stap.getBoundingClientRect().top < innerHeight * 0.6) {
          scroll.current.add(-Number(stap.dataset.metingStap));
          meet({ type: "training", pad: p.pad, naam });
        }
      }
    }
    let wacht = 0;
    function opScroll() {
      if (wacht) return;
      wacht = window.setTimeout(() => {
        wacht = 0;
        scrollen();
      }, 250);
    }
    window.addEventListener("scroll", opScroll, { passive: true });
    return () => window.removeEventListener("scroll", opScroll);
  }, []);

  // Ingesloten YouTube-video's: start, 25/50/75% en uitgekeken (W-ANA-34).
  useEffect(() => {
    const gemeld = new Map<string, Set<number>>();
    function aanmelden() {
      for (const frame of document.querySelectorAll<HTMLIFrameElement>("iframe[data-meting-video]")) {
        frame.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: frame.dataset.metingVideo }), "*");
      }
    }
    function bericht(e: MessageEvent) {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
      let data: { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number }; id?: string };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const frame = [...document.querySelectorAll<HTMLIFrameElement>("iframe[data-meting-video]")].find(
        (f) => f.contentWindow === e.source,
      );
      if (!frame || !data?.info) return;
      const video = frame.dataset.metingVideo ?? "";
      const al = gemeld.get(video) ?? new Set<number>();
      gemeld.set(video, al);
      const meld = (waarde: number) => {
        if (al.has(waarde)) return;
        al.add(waarde);
        meet({ type: "video", pad: huidig.current?.pad, naam: video, waarde });
      };
      if (data.info.playerState === 1) meld(0);
      if (data.info.playerState === 0) meld(100);
      const { currentTime, duration } = data.info;
      if (currentTime && duration) {
        const pct = (currentTime / duration) * 100;
        for (const d of [25, 50, 75]) if (pct >= d) meld(d);
        if (pct >= 99) meld(100);
      }
    }
    window.addEventListener("message", bericht);
    const timer = setInterval(aanmelden, 3000);
    aanmelden();
    return () => {
      window.removeEventListener("message", bericht);
      clearInterval(timer);
    };
  }, [pad]);

  return null;
}

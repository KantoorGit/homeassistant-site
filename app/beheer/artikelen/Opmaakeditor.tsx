"use client";

import { useEffect, useRef, useState } from "react";
import type { Opmaak } from "@/lib/beheer/artikelen";
import type { BeheerTeksten } from "@/lib/beheer/teksten";

// Het 16:9-vlak (zoals kaarten en artikelen op de site).
const vlak = 16 / 9;
const minProcent = 5;
const maxUitvoer = 2400;
const minUitvoer = 1280;

type Hoek = "nw" | "ne" | "sw" | "se";
type Sleep =
  | { soort: "verplaats"; startX: number; startY: number; begin: Opmaak }
  | { soort: "hoek"; hoek: Hoek; startX: number; startY: number; begin: Opmaak };

const rond = (n: number) => Math.round(n * 10) / 10;

// Foto passend (helemaal zichtbaar) of vullend (vlak helemaal bedekt) en
// in het midden; r = breedte/hoogte van de foto.
function startOpmaak(r: number, soort: "passend" | "vullend", oud?: Opmaak): Opmaak {
  const breedtePassend = Math.min(100, (100 * r) / vlak);
  const breedte = soort === "passend" ? breedtePassend : Math.max(100, (100 * r) / vlak);
  const hoogte = (breedte * vlak) / r;
  return {
    x: rond((100 - breedte) / 2),
    y: rond((100 - hoogte) / 2),
    breedte: rond(breedte),
    hoogte: rond(hoogte),
    vast: true,
    achtergrond: oud?.achtergrond ?? "#ffffff",
  };
}

// Tekent de 16:9-foto. Ook gebruikt voor de achtergrond "vervaagd": de foto
// eerst heel klein en dan weer groot tekenen geeft een vervaging die in
// elke browser werkt (ctx.filter werkt niet overal).
export async function tekenOpmaak(img: HTMLImageElement, o: Opmaak): Promise<Blob> {
  const { naturalWidth: nb, naturalHeight: nh } = img;
  // Resolutie: zo dat de foto op ware grootte staat, binnen de grenzen.
  let b = Math.round((nb * 100) / o.breedte);
  b = Math.max(minUitvoer, Math.min(maxUitvoer, b));
  const h = Math.round(b / vlak);
  const canvas = document.createElement("canvas");
  canvas.width = b;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";

  if (o.achtergrond === "vervaagd") {
    const klein = document.createElement("canvas");
    klein.width = 32;
    klein.height = 18;
    const k = klein.getContext("2d");
    if (!k) throw new Error("canvas");
    const schaal = Math.max(32 / nb, 18 / nh);
    const kb = nb * schaal;
    const kh = nh * schaal;
    k.drawImage(img, (32 - kb) / 2, (18 - kh) / 2, kb, kh);
    ctx.drawImage(klein, 0, 0, b, h);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, b, h);
  } else {
    ctx.fillStyle = o.achtergrond;
    ctx.fillRect(0, 0, b, h);
  }
  ctx.drawImage(img, (o.x / 100) * b, (o.y / 100) * h, (o.breedte / 100) * b, (o.hoogte / 100) * h);

  const blob = await new Promise<Blob | null>((klaar) => canvas.toBlob(klaar, "image/jpeg", 0.9));
  if (!blob) throw new Error("toBlob");
  return blob;
}

// Nieuwe 16:9-foto maken uit het origineel (W-ADM-23): zelf de breedte,
// hoogte en plek van de foto in het 16:9-vlak bepalen. Slepen = verplaatsen,
// hoeken = groter/kleiner; of de getallen invullen. Wat buiten het vlak valt
// komt er niet op (wordt hier donker getoond); lege ruimte krijgt de
// achtergrond.
export default function Opmaakeditor({
  src,
  begin,
  t,
  bezig,
  onGebruiken,
  onAnnuleren,
}: {
  src: string;
  begin: Opmaak | null;
  t: BeheerTeksten["opmaak"];
  bezig: boolean;
  onGebruiken: (img: HTMLImageElement, opmaak: Opmaak) => void;
  onAnnuleren: () => void;
}) {
  const [o, zetO] = useState<Opmaak | null>(begin);
  const [fout, zetFout] = useState(false);
  const beeld = useRef<HTMLImageElement>(null);
  const kader = useRef<HTMLDivElement>(null);
  const sleep = useRef<Sleep | null>(null);
  const verhouding = () => {
    const img = beeld.current;
    return img && img.naturalHeight ? img.naturalWidth / img.naturalHeight : vlak;
  };

  function geladen() {
    if (!o) zetO(startOpmaak(verhouding(), "passend"));
  }

  function wijzig(nieuw: Partial<Opmaak>, bron: "breedte" | "hoogte" | "anders" = "anders") {
    zetO((oud) => {
      if (!oud) return oud;
      const v = { ...oud, ...nieuw };
      const r = verhouding();
      if (v.vast && bron === "breedte") v.hoogte = rond((v.breedte * vlak) / r);
      if (v.vast && bron === "hoogte") v.breedte = rond((v.hoogte * r) / vlak);
      if (nieuw.vast === true) v.hoogte = rond((v.breedte * vlak) / r);
      v.breedte = Math.max(minProcent, v.breedte);
      v.hoogte = Math.max(minProcent, v.hoogte);
      return v;
    });
  }

  // Slepen met muis, pen of vinger.
  useEffect(() => {
    function beweeg(e: PointerEvent) {
      const s = sleep.current;
      const k = kader.current;
      if (!s || !k) return;
      const rect = k.getBoundingClientRect();
      const dx = ((e.clientX - s.startX) / rect.width) * 100;
      const dy = ((e.clientY - s.startY) / rect.height) * 100;
      const b0 = s.begin;
      if (s.soort === "verplaats") {
        zetO({ ...b0, x: rond(b0.x + dx), y: rond(b0.y + dy) });
        return;
      }
      const sx = s.hoek.endsWith("e") ? 1 : -1;
      const sy = s.hoek.startsWith("s") ? 1 : -1;
      const breedte = Math.max(minProcent, b0.breedte + sx * dx);
      const hoogte = b0.vast
        ? (breedte * vlak) / verhouding()
        : Math.max(minProcent, b0.hoogte + sy * dy);
      zetO({
        ...b0,
        breedte: rond(breedte),
        hoogte: rond(hoogte),
        x: rond(sx < 0 ? b0.x + (b0.breedte - breedte) : b0.x),
        y: rond(sy < 0 ? b0.y + (b0.hoogte - hoogte) : b0.y),
      });
    }
    function los() {
      sleep.current = null;
    }
    window.addEventListener("pointermove", beweeg);
    window.addEventListener("pointerup", los);
    window.addEventListener("pointercancel", los);
    return () => {
      window.removeEventListener("pointermove", beweeg);
      window.removeEventListener("pointerup", los);
      window.removeEventListener("pointercancel", los);
    };
  }, []);

  function start(e: React.PointerEvent, hoek?: Hoek) {
    if (!o) return;
    e.preventDefault();
    e.stopPropagation();
    sleep.current = hoek
      ? { soort: "hoek", hoek, startX: e.clientX, startY: e.clientY, begin: o }
      : { soort: "verplaats", startX: e.clientX, startY: e.clientY, begin: o };
  }

  // Pijltjestoetsen: 0,5% verplaatsen (met Shift 5%).
  function toets(e: React.KeyboardEvent) {
    if (!o) return;
    const stap = e.shiftKey ? 5 : 0.5;
    const zet: Record<string, Partial<Opmaak>> = {
      ArrowLeft: { x: rond(o.x - stap) },
      ArrowRight: { x: rond(o.x + stap) },
      ArrowUp: { y: rond(o.y - stap) },
      ArrowDown: { y: rond(o.y + stap) },
    };
    if (zet[e.key]) {
      e.preventDefault();
      wijzig(zet[e.key]);
    }
  }

  const stijl = o
    ? { left: `${o.x}%`, top: `${o.y}%`, width: `${o.breedte}%`, height: `${o.hoogte}%` }
    : { left: 0, top: 0, width: "100%", height: "100%", visibility: "hidden" as const };
  const isKleur = o ? o.achtergrond !== "vervaagd" : true;

  const getalveld = (label: string, sleutel: "breedte" | "hoogte" | "x" | "y") => (
    <label>
      {label}
      <input
        type="number"
        step="0.5"
        value={o ? o[sleutel] : ""}
        disabled={!o}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          wijzig({ [sleutel]: n }, sleutel === "breedte" || sleutel === "hoogte" ? sleutel : "anders");
        }}
      />
    </label>
  );

  return (
    <div className="opmaak">
      <p className="uitleg">{t.uitleg}</p>

      <div className="opmaak-werkvlak">
        <div
          ref={kader}
          className={`opmaak-vlak${o?.achtergrond === "vervaagd" ? " vervaagd" : ""}`}
          style={{ background: isKleur ? o?.achtergrond : undefined }}
        >
          {o?.achtergrond === "vervaagd" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="opmaak-vervaagd" crossOrigin="anonymous" aria-hidden />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={beeld}
            src={src}
            alt={t.opmaak}
            crossOrigin="anonymous"
            className="opmaak-foto"
            style={stijl}
            draggable={false}
            onLoad={geladen}
            onError={() => zetFout(true)}
          />
          <div className="opmaak-masker" aria-hidden />
          {o && (
            <div
              className="opmaak-greep"
              style={stijl}
              tabIndex={0}
              role="group"
              aria-label={t.uitleg}
              onPointerDown={(e) => start(e)}
              onKeyDown={toets}
            >
              {(["nw", "ne", "sw", "se"] as const).map((h) => (
                <span key={h} className={`opmaak-hoek ${h}`} onPointerDown={(e) => start(e, h)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {fout && (
        <p className="fout" role="alert">
          {t.laadFout}
        </p>
      )}

      <div className="opmaak-knoppen">
        <button type="button" className="knop-klein" disabled={!o} onClick={() => zetO(startOpmaak(verhouding(), "passend", o ?? undefined))}>
          {t.passend}
        </button>
        <button type="button" className="knop-klein" disabled={!o} onClick={() => zetO(startOpmaak(verhouding(), "vullend", o ?? undefined))}>
          {t.vullend}
        </button>
        <button
          type="button"
          className="knop-klein"
          disabled={!o}
          onClick={() => o && wijzig({ x: rond((100 - o.breedte) / 2), y: rond((100 - o.hoogte) / 2) })}
        >
          {t.centreren}
        </button>
      </div>

      <div className="opmaak-getallen">
        {getalveld(t.breedte, "breedte")}
        {getalveld(t.hoogte, "hoogte")}
        {getalveld(t.links, "x")}
        {getalveld(t.boven, "y")}
      </div>
      <small className="uitleg">{t.uitlegProcent}</small>
      <label className="vinkje">
        <input type="checkbox" checked={o?.vast ?? true} disabled={!o} onChange={(e) => wijzig({ vast: e.target.checked })} />
        {t.verhoudingVast}
      </label>

      <div className="opmaak-achtergrond" role="radiogroup" aria-label={t.achtergrond}>
        <span>{t.achtergrond}:</span>
        <label className="vinkje">
          <input
            type="radio"
            name="opmaak_achtergrond"
            checked={isKleur}
            disabled={!o}
            onChange={() => wijzig({ achtergrond: "#ffffff" })}
          />
          {t.kleur}
        </label>
        <input
          type="color"
          aria-label={t.kleur}
          value={isKleur && o ? o.achtergrond : "#ffffff"}
          disabled={!o}
          onChange={(e) => wijzig({ achtergrond: e.target.value.toLowerCase() })}
        />
        {["#ffffff", "#000000", "#1e3993"].map((kleur) => (
          <button
            key={kleur}
            type="button"
            className="opmaak-staal"
            style={{ background: kleur }}
            aria-label={kleur}
            disabled={!o}
            onClick={() => wijzig({ achtergrond: kleur })}
          />
        ))}
        <label className="vinkje">
          <input
            type="radio"
            name="opmaak_achtergrond"
            checked={!isKleur}
            disabled={!o}
            onChange={() => wijzig({ achtergrond: "vervaagd" })}
          />
          {t.vervaagd}
        </label>
      </div>

      <div className="beheer-knoppen">
        <button type="button" disabled={!o || bezig} onClick={() => o && beeld.current && onGebruiken(beeld.current, o)}>
          {t.gebruiken}
        </button>
        <button type="button" className="knop-link" onClick={onAnnuleren}>
          {t.annuleren}
        </button>
      </div>
    </div>
  );
}

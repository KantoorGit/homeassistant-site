"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRef, useState, useTransition } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { Uitsnede } from "@/lib/beheer/artikelen";
import type { BeheerTeksten } from "@/lib/beheer/teksten";
import { vul } from "@/lib/beheer/teksten";
import { afbeeldingKopieren } from "./afbeelding-acties";

const maxMb = 50;
const toegestaan = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const extensie: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
// Langste zijde van de uitsnede; groter is niet nodig voor de site.
const maxPixels = 2400;
// Kaarten en artikelen tonen de foto in 16:9; "groot bovenaan" in 16:8.
const siteVerhouding = 16 / 9;
const rand168 = ((1 - 8 / 9) / 2) * 100;


export type AfbeeldingWaarden = {
  afbeeldingUrl: string;
  origineelUrl: string;
  bronUrl: string;
  uitsnede: Uitsnede | null;
};

type Melding = { soort: "fout" | "melding"; tekst: string } | null;

function pad(achtervoegsel: string, ext: string) {
  const nu = new Date();
  return `afbeeldingen/${nu.getFullYear()}/${String(nu.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${achtervoegsel}.${ext}`;
}

// Afbeelding: link plakken of zelf uploaden, en daarna met de hand
// bijsnijden (W-ADM-18, W-ADM-22). Het origineel blijft bewaard
// (afbeelding_origineel_url, bij een link ook afbeelding_bron_url); de
// uitsnede is een eigen bestand in de map media en is wat de site toont
// (afbeelding_url). Het kader wordt bewaard, zodat je later opnieuw kunt
// bijsnijden vanaf het origineel.
export default function Afbeeldingveld({
  waarden,
  t,
  tu,
  supabaseUrl,
  supabaseSleutel,
}: {
  waarden: AfbeeldingWaarden;
  t: BeheerTeksten["formulier"];
  tu: BeheerTeksten["uitsnede"];
  supabaseUrl: string;
  supabaseSleutel: string;
}) {
  const eigenOpslag = supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/media/` : "\u0000";
  const isEigen = (adres: string) => adres.startsWith(eigenOpslag);

  const heeftOrigineel = !!waarden.origineelUrl;
  const [link, zetLink] = useState(heeftOrigineel ? waarden.bronUrl || waarden.origineelUrl : waarden.afbeeldingUrl);
  const [origineel, zetOrigineel] = useState(
    waarden.origineelUrl || (isEigen(waarden.afbeeldingUrl) ? waarden.afbeeldingUrl : ""),
  );
  const [bron, zetBron] = useState(waarden.bronUrl);
  const [uitsnedeUrl, zetUitsnedeUrl] = useState(
    heeftOrigineel && waarden.afbeeldingUrl !== waarden.origineelUrl ? waarden.afbeeldingUrl : "",
  );
  const [kader, zetKader] = useState<Uitsnede | null>(waarden.uitsnede);

  const [bewerken, zetBewerken] = useState(false);
  const [crop, zetCrop] = useState<PercentCrop>();
  const [verhouding, zetVerhouding] = useState<Uitsnede["verhouding"]>(waarden.uitsnede?.verhouding ?? "16:9");
  const [melding, zetMelding] = useState<Melding>(null);
  const [bezig, zetBezig] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const bestandVeld = useRef<HTMLInputElement>(null);
  const beeld = useRef<HTMLImageElement>(null);

  const supabase = () => createBrowserClient(supabaseUrl, supabaseSleutel);

  function nieuweFoto(adres: string, eigen: boolean) {
    zetLink(adres);
    zetOrigineel(eigen ? adres : "");
    zetBron(eigen ? "" : adres);
    zetUitsnedeUrl("");
    zetKader(null);
    zetCrop(undefined);
    zetBewerken(false);
  }

  async function upload(bestand: File) {
    zetMelding(null);
    if (!toegestaan.includes(bestand.type)) return zetMelding({ soort: "fout", tekst: t.uploadType });
    if (bestand.size > maxMb * 1024 * 1024) {
      return zetMelding({ soort: "fout", tekst: vul(t.uploadTeGroot, { mb: maxMb }) });
    }
    if (!supabaseUrl || !supabaseSleutel) {
      return zetMelding({ soort: "fout", tekst: vul(t.uploadMislukt, { fout: "Supabase" }) });
    }
    zetBezig(t.uploadBezig);
    try {
      const client = supabase();
      const p = pad("origineel", extensie[bestand.type] ?? "bin");
      const { error } = await client.storage.from("media").upload(p, bestand, {
        contentType: bestand.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        return zetMelding({
          soort: "fout",
          tekst: /bucket not found/i.test(error.message) ? t.uploadNietKlaar : vul(t.uploadMislukt, { fout: error.message }),
        });
      }
      nieuweFoto(client.storage.from("media").getPublicUrl(p).data.publicUrl, true);
      // Na het uploaden meteen het kader laten kiezen.
      zetBewerken(true);
      zetMelding({ soort: "melding", tekst: t.uploadKlaar });
    } catch (e) {
      zetMelding({ soort: "fout", tekst: vul(t.uploadMislukt, { fout: e instanceof Error ? e.message : "?" }) });
    } finally {
      zetBezig(null);
      if (bestandVeld.current) bestandVeld.current.value = "";
    }
  }

  // Een foto van internet eerst als kopie in de eigen opslag zetten; anders
  // mag de browser hem niet bijsnijden.
  function startBijsnijden() {
    zetMelding(null);
    if (origineel) {
      zetBewerken(true);
      return;
    }
    if (!/^https:\/\//.test(link)) return zetMelding({ soort: "fout", tekst: tu.linkOngeldig });
    zetBezig(tu.ophalen);
    startTransition(async () => {
      const r = await afbeeldingKopieren(link);
      zetBezig(null);
      if (r.fout || !r.url) return zetMelding({ soort: "fout", tekst: r.fout ?? "?" });
      zetOrigineel(r.url);
      zetBron(link);
      zetBewerken(true);
    });
  }

  function beginKader(img: HTMLImageElement) {
    const { naturalWidth: b, naturalHeight: h } = img;
    if (kader) {
      zetCrop({ unit: "%", x: kader.x, y: kader.y, width: kader.breedte, height: kader.hoogte });
      return;
    }
    zetCrop(
      verhouding === "16:9"
        ? centerCrop(makeAspectCrop({ unit: "%", width: 100 }, siteVerhouding, b, h), b, h)
        : { unit: "%", x: 5, y: 5, width: 90, height: 90 },
    );
  }

  function kiesVerhouding(nieuw: Uitsnede["verhouding"]) {
    zetVerhouding(nieuw);
    const img = beeld.current;
    if (nieuw === "16:9" && img && crop) {
      const { naturalWidth: b, naturalHeight: h } = img;
      const midX = crop.x + crop.width / 2;
      const midY = crop.y + crop.height / 2;
      const c = makeAspectCrop({ unit: "%", width: crop.width }, siteVerhouding, b, h);
      // Past het niet in de hoogte, dan kleiner maken.
      const passend = c.height > 100 ? makeAspectCrop({ unit: "%", height: 100 }, siteVerhouding, b, h) : c;
      const x = Math.min(Math.max(midX - passend.width / 2, 0), 100 - passend.width);
      const y = Math.min(Math.max(midY - passend.height / 2, 0), 100 - passend.height);
      zetCrop({ ...passend, x, y });
    }
  }

  async function uitsnedeGebruiken() {
    const img = beeld.current;
    if (!img || !crop || crop.width <= 0 || crop.height <= 0) return;
    zetMelding(null);
    zetBezig(tu.bezig);
    try {
      const { naturalWidth: nb, naturalHeight: nh } = img;
      const sx = (crop.x / 100) * nb;
      const sy = (crop.y / 100) * nh;
      const sb = (crop.width / 100) * nb;
      const sh = (crop.height / 100) * nh;
      const schaal = Math.min(1, maxPixels / Math.max(sb, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sb * schaal));
      canvas.height = Math.max(1, Math.round(sh * schaal));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#fff"; // doorzichtige PNG's: witte achtergrond
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sb, sh, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((klaar) => canvas.toBlob(klaar, "image/jpeg", 0.9));
      if (!blob) throw new Error("toBlob");

      const client = supabase();
      const p = pad("uitsnede", "jpg");
      const { error } = await client.storage.from("media").upload(p, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new Error(error.message);
      zetUitsnedeUrl(client.storage.from("media").getPublicUrl(p).data.publicUrl);
      const rond = (n: number) => Math.round(n * 1000) / 1000;
      zetKader({ x: rond(crop.x), y: rond(crop.y), breedte: rond(crop.width), hoogte: rond(crop.height), verhouding });
      zetBewerken(false);
      zetMelding({ soort: "melding", tekst: tu.klaar });
    } catch (e) {
      const tekst = e instanceof DOMException && e.name === "SecurityError" ? tu.laadFout : vul(tu.opslaanMislukt, { fout: e instanceof Error ? e.message : "?" });
      zetMelding({ soort: "fout", tekst });
    } finally {
      zetBezig(null);
    }
  }

  // Wat de site toont, en wat er bewaard wordt.
  const opDeSite = uitsnedeUrl || origineel || link;
  const toonOrigineel = origineel || (/^https:\/\//.test(link) ? link : "");

  return (
    <div className="mediaveld afbeeldingveld">
      <input type="hidden" name="afbeelding_url" value={opDeSite} />
      <input type="hidden" name="afbeelding_origineel_url" value={origineel} />
      <input type="hidden" name="afbeelding_bron_url" value={bron} />
      <input type="hidden" name="afbeelding_uitsnede" value={uitsnedeUrl && kader ? JSON.stringify(kader) : ""} />

      <label>
        {t.afbeeldingLink}
        <input
          type="url"
          value={link}
          onChange={(e) => {
            const v = e.target.value.trim();
            nieuweFoto(v, isEigen(v));
          }}
          placeholder="https://…"
        />
      </label>
      <label className="mediaveld-upload">
        {t.afbeeldingUploaden}
        <input
          ref={bestandVeld}
          type="file"
          accept={toegestaan.join(",")}
          disabled={!!bezig}
          onChange={(e) => {
            const bestand = e.target.files?.[0];
            if (bestand) void upload(bestand);
          }}
        />
        <small>{t.afbeeldingTypes}</small>
      </label>

      {bezig && (
        <p className="uitleg" role="status">
          {bezig}
        </p>
      )}
      {melding && (
        <p className={melding.soort} role={melding.soort === "fout" ? "alert" : "status"}>
          {melding.tekst}
        </p>
      )}

      {bewerken && origineel && (
        <div className="bijsnijden">
          <p className="uitleg">{tu.uitleg}</p>
          <div className="bijsnijden-verhouding" role="radiogroup" aria-label={tu.verhouding}>
            <span>{tu.verhouding}:</span>
            {(["16:9", "vrij"] as const).map((v) => (
              <label key={v} className="vinkje">
                <input
                  type="radio"
                  name="verhouding_keuze"
                  checked={verhouding === v}
                  onChange={() => kiesVerhouding(v)}
                />
                {v === "16:9" ? tu.verhoudingSite : tu.verhoudingVrij}
              </label>
            ))}
          </div>
          <small className="uitleg">{verhouding === "16:9" ? tu.stippellijnen : tu.vrijUitleg}</small>
          <ReactCrop
            crop={crop}
            onChange={(_, procent) => zetCrop(procent)}
            aspect={verhouding === "16:9" ? siteVerhouding : undefined}
            keepSelection
            ruleOfThirds
            minWidth={40}
            renderSelectionAddon={() =>
              verhouding === "16:9" ? (
                <div className="bijsnijden-168" style={{ top: `${rand168}%`, bottom: `${rand168}%` }} aria-hidden />
              ) : null
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={beeld}
              src={origineel}
              alt={tu.origineel}
              crossOrigin="anonymous"
              onLoad={(e) => beginKader(e.currentTarget)}
              onError={() => zetMelding({ soort: "fout", tekst: tu.laadFout })}
            />
          </ReactCrop>
          <div className="beheer-knoppen">
            <button type="button" onClick={() => void uitsnedeGebruiken()} disabled={!!bezig || !crop}>
              {tu.gebruiken}
            </button>
            <button type="button" className="knop-link" onClick={() => zetBewerken(false)}>
              {tu.annuleren}
            </button>
          </div>
        </div>
      )}

      {!bewerken && opDeSite && /^https:\/\//.test(opDeSite) && (
        <div className="mediaveld-voorbeeld afbeelding-voorbeelden">
          <figure>
            <figcaption>{tu.opDeSite}</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opDeSite} alt={t.voorbeeld} className="voorbeeld-169" crossOrigin="anonymous" />
          </figure>
          {uitsnedeUrl && toonOrigineel && (
            <figure>
              <figcaption>{tu.origineel}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toonOrigineel} alt={tu.origineel} crossOrigin={isEigen(toonOrigineel) ? "anonymous" : undefined} />
            </figure>
          )}
          {uitsnedeUrl && <small className="uitleg">{tu.origineelBewaard}</small>}
          {bron && (
            <small className="uitleg">
              {tu.bron}:{" "}
              <a href={bron} target="_blank" rel="noreferrer noopener">
                {bron.length > 70 ? `${bron.slice(0, 70)}…` : bron}
              </a>
            </small>
          )}
          <div className="beheer-knoppen">
            <button type="button" onClick={startBijsnijden} disabled={!!bezig}>
              {uitsnedeUrl ? tu.aanpassen : tu.bijsnijden}
            </button>
            {uitsnedeUrl && (
              <button
                type="button"
                className="knop-link"
                onClick={() => {
                  zetUitsnedeUrl("");
                  zetKader(null);
                  zetCrop(undefined);
                }}
              >
                {tu.weghalen}
              </button>
            )}
            <button type="button" className="knop-link" onClick={() => nieuweFoto("", false)}>
              {t.weghalen}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

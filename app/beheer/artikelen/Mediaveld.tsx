"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRef, useState } from "react";
import type { BeheerTeksten } from "@/lib/beheer/teksten";
import { vul } from "@/lib/beheer/teksten";

const maxMb = 50;

const toegestaan = {
  afbeelding: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

const extensie: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Een link plakken óf zelf een bestand uploaden (W-ADM-18, W-ADM-19). Het
// bestand gaat rechtstreeks van de browser naar Supabase Storage (map
// "media"), met de inlogsessie van de redacteur; daarna staat het adres in
// het veld en wordt het bij Opslaan bewaard.
export default function Mediaveld({
  soort,
  naam,
  waarde,
  t,
  supabaseUrl,
  supabaseSleutel,
}: {
  soort: "afbeelding" | "video";
  naam: string;
  waarde: string;
  t: BeheerTeksten["formulier"];
  supabaseUrl: string;
  supabaseSleutel: string;
}) {
  const [adres, zetAdres] = useState(waarde);
  const [melding, zetMelding] = useState<{ soort: "fout" | "melding"; tekst: string } | null>(null);
  const [bezig, zetBezig] = useState(false);
  const bestandVeld = useRef<HTMLInputElement>(null);

  async function upload(bestand: File) {
    zetMelding(null);
    if (!toegestaan[soort].includes(bestand.type)) {
      zetMelding({ soort: "fout", tekst: t.uploadType });
      return;
    }
    if (bestand.size > maxMb * 1024 * 1024) {
      zetMelding({ soort: "fout", tekst: vul(t.uploadTeGroot, { mb: maxMb }) });
      return;
    }
    if (!supabaseUrl || !supabaseSleutel) {
      zetMelding({ soort: "fout", tekst: vul(t.uploadMislukt, { fout: "Supabase" }) });
      return;
    }
    zetBezig(true);
    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseSleutel);
      const nu = new Date();
      const map = `${soort === "video" ? "videos" : "afbeeldingen"}/${nu.getFullYear()}/${String(nu.getMonth() + 1).padStart(2, "0")}`;
      const pad = `${map}/${crypto.randomUUID()}.${extensie[bestand.type] ?? "bin"}`;
      const { error } = await supabase.storage.from("media").upload(pad, bestand, {
        contentType: bestand.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        zetMelding({
          soort: "fout",
          tekst: /bucket not found/i.test(error.message)
            ? t.uploadNietKlaar
            : vul(t.uploadMislukt, { fout: error.message }),
        });
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(pad);
      zetAdres(data.publicUrl);
      zetMelding({ soort: "melding", tekst: t.uploadKlaar });
    } catch (e) {
      zetMelding({ soort: "fout", tekst: vul(t.uploadMislukt, { fout: e instanceof Error ? e.message : "?" }) });
    } finally {
      zetBezig(false);
      if (bestandVeld.current) bestandVeld.current.value = "";
    }
  }

  const isVideoBestand = soort === "video" && /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(adres);

  return (
    <div className="mediaveld">
      <label>
        {soort === "afbeelding" ? t.afbeeldingLink : t.videoLink}
        <input
          name={naam}
          type="url"
          value={adres}
          onChange={(e) => zetAdres(e.target.value)}
          placeholder={soort === "afbeelding" ? "https://…" : "https://www.youtube.com/watch?v=…"}
        />
        {soort === "video" && <small>{t.videoLinkUitleg}</small>}
      </label>
      <label className="mediaveld-upload">
        {soort === "afbeelding" ? t.afbeeldingUploaden : t.videoUploaden}
        <input
          ref={bestandVeld}
          type="file"
          accept={toegestaan[soort].join(",")}
          disabled={bezig}
          onChange={(e) => {
            const bestand = e.target.files?.[0];
            if (bestand) void upload(bestand);
          }}
        />
        <small>{soort === "afbeelding" ? t.afbeeldingTypes : t.videoTypes}</small>
      </label>
      {bezig && (
        <p className="uitleg" role="status">
          {t.uploadBezig}
        </p>
      )}
      {melding && (
        <p className={melding.soort} role={melding.soort === "fout" ? "alert" : "status"}>
          {melding.tekst}
        </p>
      )}
      {adres && /^https:\/\//.test(adres) && (soort === "afbeelding" || isVideoBestand) && (
        <div className="mediaveld-voorbeeld">
          {soort === "afbeelding" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={adres} alt={t.voorbeeld} />
          ) : (
            <video src={adres} controls preload="metadata" />
          )}
          <button type="button" className="knop-link" onClick={() => zetAdres("")}>
            {t.weghalen}
          </button>
        </div>
      )}
    </div>
  );
}

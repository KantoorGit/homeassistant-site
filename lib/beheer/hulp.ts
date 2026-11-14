// Kleine hulpfuncties voor het beheerpaneel.

import type { Taal } from "@/lib/site";
import { landcode } from "./teksten";

const tijdzone = "Europe/Amsterdam";

// Verschil tussen Amsterdamse tijd en UTC (in minuten) op een bepaald moment.
function afwijkingAmsterdam(moment: Date): number {
  const delen = new Intl.DateTimeFormat("en-US", {
    timeZone: tijdzone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(moment);
  const deel = (type: string) =>
    Number(delen.find((d) => d.type === type)?.value ?? 0);
  const alsUtc = Date.UTC(
    deel("year"),
    deel("month") - 1,
    deel("day"),
    deel("hour"),
    deel("minute"),
  );
  return Math.round((alsUtc - moment.getTime()) / 60000);
}

// "2026-11-13T10:00" (ingevuld als Amsterdamse tijd) -> ISO-tijd in UTC.
export function amsterdamNaarIso(invoer: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(invoer);
  if (!m) return null;
  const alsUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Twee keer corrigeren, zodat ook de dagen rond de zomertijdwissel kloppen.
  let moment = alsUtc - afwijkingAmsterdam(new Date(alsUtc)) * 60000;
  moment = alsUtc - afwijkingAmsterdam(new Date(moment)) * 60000;
  return new Date(moment).toISOString();
}

// ISO-tijd -> "2026-11-13T10:00" in Amsterdamse tijd, voor een invoerveld.
export function isoNaarAmsterdam(iso: string | null): string {
  if (!iso) return "";
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return "";
  const lokaal = new Date(
    moment.getTime() + afwijkingAmsterdam(moment) * 60000,
  );
  return lokaal.toISOString().slice(0, 16);
}

export function tijdTekst(iso: string | null, taal: Taal = "nl"): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(landcode[taal], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tijdzone,
  }).format(new Date(iso));
}

// Maakt van een kop een leesbaar webadres: "Zigbee of Matter?" -> "zigbee-of-matter".
export function maakSlug(tekst: string): string {
  return tekst
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// Video-adressen: zie lib/video.ts.
export { videoInfo, youtubeId } from "@/lib/video";

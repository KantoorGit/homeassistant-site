"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { beheerT } from "@/lib/beheer/taal";
import { vul } from "@/lib/beheer/teksten";
import { vereisRedacteur } from "@/lib/beheer/toegang";

const maxBytes = 50 * 1024 * 1024;

const extensie: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Adressen in het eigen netwerk van de server niet ophalen (anders kan een
// link de server iets intern laten opvragen).
function isPriveAdres(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const laag = ip.toLowerCase();
  if (laag.startsWith("::ffff:")) return isPriveAdres(laag.slice(7));
  return (
    laag === "::" ||
    laag === "::1" ||
    laag.startsWith("fc") ||
    laag.startsWith("fd") ||
    laag.startsWith("fe80") ||
    laag.startsWith("ff")
  );
}

async function veiligAdres(adres: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(adres);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (ips.length === 0 || ips.some(isPriveAdres)) return null;
  return url;
}

// Een foto van internet bijsnijden (W-ADM-22): de server haalt de foto op
// en zet een kopie van het origineel in Supabase Storage (map media). De
// browser kan die kopie daarna bijsnijden; bij foto's op andere sites lukt
// dat niet rechtstreeks, omdat die site dat meestal niet toestaat.
export async function afbeeldingKopieren(link: string): Promise<{ url?: string; fout?: string }> {
  const { supabase } = await vereisRedacteur();
  const { t: alle } = await beheerT();
  const t = alle.uitsnede;

  const eerste = await veiligAdres(link.trim());
  if (!eerste) return { fout: t.linkOngeldig };
  let url: URL = eerste;

  let antwoord: Response | null = null;
  try {
    for (let stap = 0; stap < 4; stap++) {
      antwoord = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
        headers: { accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.5" },
      });
      if (antwoord.status >= 300 && antwoord.status < 400) {
        const volgende = antwoord.headers.get("location");
        const nieuw = volgende ? await veiligAdres(new URL(volgende, url).toString()) : null;
        if (!nieuw) return { fout: t.linkOngeldig };
        url = nieuw;
        continue;
      }
      break;
    }
  } catch (e) {
    return { fout: vul(t.ophalenMislukt, { fout: e instanceof Error ? e.message : "?" }) };
  }
  if (!antwoord || !antwoord.ok || !antwoord.body) {
    return { fout: vul(t.ophalenMislukt, { fout: String(antwoord?.status ?? "?") }) };
  }

  const type = (antwoord.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!extensie[type]) return { fout: t.geenAfbeelding };
  if (Number(antwoord.headers.get("content-length") ?? 0) > maxBytes) return { fout: t.teGroot };

  // Inlezen met een grens, ook als de site geen lengte opgeeft.
  const delen: Uint8Array[] = [];
  let totaal = 0;
  const lezer = antwoord.body.getReader();
  for (;;) {
    const { done, value } = await lezer.read();
    if (done) break;
    totaal += value.byteLength;
    if (totaal > maxBytes) {
      await lezer.cancel();
      return { fout: t.teGroot };
    }
    delen.push(value);
  }
  const inhoud = new Blob(delen as BlobPart[], { type });

  const nu = new Date();
  const pad = `afbeeldingen/${nu.getFullYear()}/${String(nu.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-origineel.${extensie[type]}`;
  const { error } = await supabase.storage.from("media").upload(pad, inhoud, {
    contentType: type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { fout: vul(t.opslaanMislukt, { fout: error.message }) };
  return { url: supabase.storage.from("media").getPublicUrl(pad).data.publicUrl };
}

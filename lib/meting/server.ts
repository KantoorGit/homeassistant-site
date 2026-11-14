import "server-only";
import { createHash } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { maakBeheerClient } from "@/lib/supabase-server";
import { supabaseInstellingen } from "@/lib/supabase";
import { isTaal } from "@/lib/site";
import { bepaalKanaal, type Utm } from "./kanaal";
import {
  bezoekerCookie,
  schoonPad,
  toestemmingCookie,
  type Gebeurtenis,
  type Verzending,
} from "./instellingen";
import { herkenApparaat, isRobot } from "./ua";

type Cookies = { get(naam: string): { value: string } | undefined; getAll(): { name: string; value: string }[] };
type Headers = { get(naam: string): string | null };

const uuidVorm = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sha256(tekst: string): string {
  return createHash("sha256").update(tekst).digest("hex");
}

export function ipVan(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    ""
  );
}

// Uitgebreid niveau alleen met toestemming en zonder Global Privacy Control.
export function heeftToestemming(c: Cookies, h: Headers): string | null {
  if (h.get("sec-gpc") === "1") return null;
  if (!c.get(toestemmingCookie)?.value.startsWith("ja.")) return null;
  const bezoeker = c.get(bezoekerCookie)?.value ?? "";
  return uuidVorm.test(bezoeker) ? bezoeker.toLowerCase() : null;
}

// De dagsleutel wordt kort in het geheugen bewaard (per serverinstantie).
let dagsleutelCache: { dag: string; sleutel: string } | null = null;

async function dagsleutel(): Promise<string | null> {
  const dag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  if (dagsleutelCache?.dag === dag) return dagsleutelCache.sleutel;
  const db = maakBeheerClient();
  if (!db) return null;
  const { data, error } = await db.rpc("meting_dagsleutel");
  if (error || typeof data !== "string") return null;
  dagsleutelCache = { dag, sleutel: data };
  return data;
}

// Sessiesleutel: op basisniveau een anonieme code die elke dag wisselt,
// afgeleid van IP-adres, browser en de geheime dagsleutel (W-ANA-40). Het
// IP-adres zelf wordt niet bewaard. Met toestemming: afgeleid van de
// bezoekerscode uit de cookie.
async function sessiesleutel(h: Headers, bezoeker: string | null): Promise<string | null> {
  if (bezoeker) return sha256(`bezoeker:${bezoeker}`);
  const sleutel = await dagsleutel();
  if (!sleutel) return null;
  return sha256(`${sleutel}|${ipVan(h)}|${h.get("user-agent") ?? ""}|${h.get("host") ?? ""}`);
}

// Is dit een bezoek van iemand van de redactie (beheerder, redacteur of
// moderator)? Die bezoeken worden apart gemarkeerd (W-ANA-60). De uitkomst
// wordt per account een kwartier onthouden.
const rolCache = new Map<string, { staf: boolean; tot: number }>();

async function ingelogdeGebruiker(c: Cookies): Promise<{ id: string; staf: boolean } | null> {
  const heeftSessie = c.getAll().some((k) => k.name.startsWith("sb-") && k.name.includes("-auth-token"));
  if (!heeftSessie) return null;
  const { url, sleutel } = supabaseInstellingen();
  if (!url || !sleutel) return null;
  const supabase = createServerClient(url, sleutel, {
    cookies: { getAll: () => c.getAll(), setAll: () => {} },
  });
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (typeof id !== "string") return null;

  const bewaard = rolCache.get(id);
  if (bewaard && bewaard.tot > Date.now()) return { id, staf: bewaard.staf };
  const db = maakBeheerClient();
  const { data: profiel } = db
    ? await db.from("profielen").select("rol").eq("id", id).maybeSingle()
    : { data: null };
  const staf = ["beheerder", "redacteur", "moderator"].includes(profiel?.rol ?? "");
  rolCache.set(id, { staf, tot: Date.now() + 15 * 60_000 });
  return { id, staf };
}

function isPreview(h: Headers): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return true;
  const host = (h.get("host") ?? "").toLowerCase();
  return host !== "www.winstonyip.com";
}

function tekst(waarde: unknown, max: number): string | undefined {
  return typeof waarde === "string" && waarde ? waarde.slice(0, max) : undefined;
}

function schoonGebeurtenis(g: unknown): Gebeurtenis | null {
  if (!g || typeof g !== "object") return null;
  const r = g as Record<string, unknown>;
  const type = r.type as Gebeurtenis["type"];
  const pad = tekst(r.pad, 500);
  const naam = tekst(r.naam, 200);
  return {
    type,
    pad: pad ? schoonPad(pad) : undefined,
    paginatype: tekst(r.paginatype, 20),
    categorie: tekst(r.categorie, 40),
    artikel_id: tekst(r.artikel_id, 60),
    taal: tekst(r.taal, 5),
    // Interne links en verwijzers ook schoonmaken; andere namen blijven kort.
    naam: naam && naam.startsWith("/") ? schoonPad(naam) : naam,
    plek: tekst(r.plek, 40),
    waarde: typeof r.waarde === "number" && Number.isFinite(r.waarde) ? r.waarde : undefined,
  };
}

// Verwerkt een verzending van het meetscript of een doel van de server.
// Faalt stil: meten mag de site nooit hinderen (W-ANA-61).
export async function verwerkMeting(
  invoer: Verzending,
  c: Cookies,
  h: Headers,
): Promise<void> {
  const ua = h.get("user-agent") ?? "";
  if (isRobot(ua)) return;
  const db = maakBeheerClient();
  if (!db) return;

  const bezoeker = heeftToestemming(c, h);
  const sleutel = await sessiesleutel(h, bezoeker);
  if (!sleutel) return;
  const gebruiker = await ingelogdeGebruiker(c);
  const platform = Number(h.get("sec-ch-ua-platform-version")?.replace(/"/g, "").split(".")[0]);
  const apparaat = herkenApparaat(ua, platform >= 13 ? "11" : null);
  const eigenHost = (h.get("host") ?? "").toLowerCase();

  const gebeurtenissen = (invoer.gebeurtenissen ?? [])
    .slice(0, 100)
    .map(schoonGebeurtenis)
    .filter((g): g is Gebeurtenis => g !== null);
  if (gebeurtenissen.length === 0) return;

  // Herkomst: alleen bruikbaar als dit de eerste verzending na het laden van
  // een pagina is. Zonder herkomst begint een nieuwe sessie intern.
  let verwijzer: string | null = null;
  let verwijzerPad: string | null = null;
  let utm: Utm = {};
  if (invoer.herkomst) {
    try {
      if (invoer.herkomst.verwijzer) {
        const u = new URL(invoer.herkomst.verwijzer);
        verwijzer = u.hostname.toLowerCase();
        verwijzerPad = schoonPad(u.pathname);
      }
    } catch {
      verwijzer = null;
    }
    const ruw = invoer.herkomst.utm ?? {};
    utm = {
      source: tekst(ruw.source, 200),
      medium: tekst(ruw.medium, 200),
      campaign: tekst(ruw.campaign, 200),
      term: tekst(ruw.term, 200),
      content: tekst(ruw.content, 200),
    };
  }
  const { kanaal, zoekmachine } = invoer.herkomst
    ? bepaalKanaal(verwijzer, eigenHost, utm)
    : { kanaal: "Intern", zoekmachine: null };

  const stad = h.get("x-vercel-ip-city");
  const sessie = {
    bezoeker_id: bezoeker,
    gebruiker_id: bezoeker ? gebruiker?.id ?? null : null,
    verwijzer: kanaal === "Intern" ? null : verwijzer,
    verwijzer_pad: kanaal === "Intern" ? null : verwijzerPad,
    kanaal,
    zoekmachine,
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_term: utm.term,
    utm_content: utm.content,
    browser: apparaat.browser,
    browser_versie: apparaat.browserVersie,
    os: apparaat.os,
    os_versie: apparaat.osVersie,
    apparaat: apparaat.apparaat,
    scherm: tekst(invoer.scherm, 20),
    venster: tekst(invoer.venster, 20),
    browsertaal: tekst(invoer.browsertaal, 20),
    sitetaal: isTaal(invoer.sitetaal) ? invoer.sitetaal : undefined,
    // Locatie uit de gegevens die Vercel meestuurt; geen IP-adres (W-ANA-21).
    land: tekst(h.get("x-vercel-ip-country"), 2),
    regio: tekst(h.get("x-vercel-ip-country-region"), 10),
    // De stad alleen met toestemming (W-ANA-22).
    stad: bezoeker && stad ? decodeURIComponent(stad).slice(0, 100) : undefined,
    is_beheerder: gebruiker?.staf ?? false,
    is_preview: isPreview(h),
  };

  const { error } = await db.rpc("meting_ontvang", {
    p_sleutel: sleutel,
    p_sessie: sessie,
    p_gebeurtenissen: gebeurtenissen,
  });
  if (error) console.error("Meting niet opgeslagen:", error.code, error.message);
}

export async function bewaarToestemming(
  keuze: "accepteren" | "weigeren",
  versie: string,
  c: Cookies,
): Promise<void> {
  const db = maakBeheerClient();
  if (!db) return;
  const bezoeker = c.get(bezoekerCookie)?.value ?? "";
  await db.from("meting_toestemmingen").insert({
    keuze,
    versie: versie.slice(0, 10),
    bezoeker_id: keuze === "accepteren" && uuidVorm.test(bezoeker) ? bezoeker : null,
  });
}

// Telt een doel vanuit een server-actie (W-ANA-37): registratie voltooid,
// 2FA gekoppeld, ingelogd, nieuwe forumvraag, reactie, melding. Gebruik in
// after(), zodat de actie er niet op wacht.
export async function telDoel(naam: string): Promise<void> {
  try {
    const h = await headers();
    const c = await cookies();
    let pad: string | undefined;
    let taal: string | undefined;
    try {
      const verwijzer = h.get("referer");
      if (verwijzer) {
        pad = new URL(verwijzer).pathname;
        taal = pad.split("/")[1];
      }
    } catch {
      // geen pad
    }
    await verwerkMeting(
      { sitetaal: isTaal(taal) ? taal : undefined, gebeurtenissen: [{ type: "doel", naam, pad, taal }] },
      c,
      h,
    );
  } catch (fout) {
    console.error("Doel niet geteld:", fout);
  }
}

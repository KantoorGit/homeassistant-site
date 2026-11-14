// Herkent browser, besturingssysteem en apparaattype uit de user-agent.
// Eigen, kleine herkenning in plaats van een bibliotheek (geen
// licentievragen, en we hebben alleen de hoofdlijnen nodig). De volledige
// user-agent wordt niet opgeslagen.

export type Apparaatinfo = {
  browser: string;
  browserVersie: string;
  os: string;
  osVersie: string;
  apparaat: "computer" | "tablet" | "telefoon";
};

const robotPatroon =
  /bot\b|bot\/|crawl|spider|slurp|scrap|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl\/|wget\/|python-|httpclient|okhttp|go-http|java\/|axios|node-fetch|undici|postman|vercel-|chrome-lighthouse|feedfetcher|mediapartners/i;

export function isRobot(ua: string): boolean {
  return !ua || ua.length < 20 || robotPatroon.test(ua);
}

function versie(ua: string, patroon: RegExp): string {
  const m = ua.match(patroon);
  return m?.[1]?.replace(/_/g, ".") ?? "";
}

export function herkenApparaat(ua: string, platformHint?: string | null): Apparaatinfo {
  let browser = "Overig";
  let browserVersie = "";
  if (/Edg(?:e|A|iOS)?\//.test(ua)) {
    browser = "Edge";
    browserVersie = versie(ua, /Edg(?:e|A|iOS)?\/([\d.]+)/);
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = "Opera";
    browserVersie = versie(ua, /(?:OPR|Opera)\/([\d.]+)/);
  } else if (/SamsungBrowser\//.test(ua)) {
    browser = "Samsung Internet";
    browserVersie = versie(ua, /SamsungBrowser\/([\d.]+)/);
  } else if (/Firefox\/|FxiOS\//.test(ua)) {
    browser = "Firefox";
    browserVersie = versie(ua, /(?:Firefox|FxiOS)\/([\d.]+)/);
  } else if (/CriOS\//.test(ua)) {
    browser = "Chrome";
    browserVersie = versie(ua, /CriOS\/([\d.]+)/);
  } else if (/Chrome\/|Chromium\//.test(ua)) {
    browser = "Chrome";
    browserVersie = versie(ua, /(?:Chrome|Chromium)\/([\d.]+)/);
  } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
    browser = "Safari";
    browserVersie = versie(ua, /Version\/([\d.]+)/);
  }

  let os = "Overig";
  let osVersie = "";
  if (/iPhone|iPod/.test(ua)) {
    os = "iOS";
    osVersie = versie(ua, /OS (\d+(?:_\d+)?)/);
  } else if (/iPad/.test(ua)) {
    os = "iPadOS";
    osVersie = versie(ua, /OS (\d+(?:_\d+)?)/);
  } else if (/Android/.test(ua)) {
    os = "Android";
    osVersie = versie(ua, /Android (\d+(?:\.\d+)?)/);
  } else if (/CrOS/.test(ua)) {
    os = "ChromeOS";
  } else if (/Windows NT/.test(ua)) {
    os = "Windows";
    const nt = versie(ua, /Windows NT ([\d.]+)/);
    // Windows 11 meldt zich in de user-agent ook als NT 10.0.
    osVersie = nt === "10.0" ? (platformHint === "11" ? "11" : "10/11") : nt;
  } else if (/Mac OS X|Macintosh/.test(ua)) {
    os = "macOS";
    osVersie = versie(ua, /Mac OS X (\d+(?:_\d+)?)/);
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  let apparaat: Apparaatinfo["apparaat"] = "computer";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/.test(ua)) apparaat = "tablet";
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/.test(ua)) apparaat = "telefoon";

  return {
    browser,
    browserVersie: browserVersie.split(".").slice(0, 2).join("."),
    os,
    osVersie,
    apparaat,
  };
}

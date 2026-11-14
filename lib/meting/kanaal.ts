// Indeling van de herkomst in kanalen (W-ANA-10).

export type Utm = Partial<
  Record<"source" | "medium" | "campaign" | "term" | "content", string>
>;

const zoekmachines: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)search\.yahoo\.|(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)baidu\.com$/, "Baidu"],
  [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)qwant\.com$/, "Qwant"],
  [/(^|\.)startpage\.com$/, "Startpage"],
  [/(^|\.)search\.brave\.com$/, "Brave"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)chatgpt\.com$/, "ChatGPT"],
  [/(^|\.)claude\.ai$/, "Claude"],
];

const social =
  /(^|\.)(facebook\.com|fb\.com|instagram\.com|t\.co|twitter\.com|x\.com|linkedin\.com|lnkd\.in|reddit\.com|youtube\.com|youtu\.be|tiktok\.com|pinterest\.|mastodon\.|threads\.net|bsky\.app|whatsapp\.com|telegram\.org)$/;

const webmail = /^(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|outlook\.office365\.com|mail\.yahoo\.com)$/;

export function bepaalKanaal(
  verwijzerHost: string | null,
  eigenHost: string,
  utm: Utm,
): { kanaal: string; zoekmachine: string | null } {
  const medium = (utm.medium ?? "").toLowerCase();
  if (/^(e-?mail|newsletter|nieuwsbrief)$/.test(medium)) return { kanaal: "E-mail", zoekmachine: null };
  if (/social/.test(medium)) return { kanaal: "Social", zoekmachine: null };
  if (utm.source || utm.campaign) return { kanaal: "Campagne", zoekmachine: null };

  if (!verwijzerHost) return { kanaal: "Direct", zoekmachine: null };
  const host = verwijzerHost.toLowerCase();
  if (host === eigenHost || host.endsWith(".winstonyip.com") || host === "winstonyip.com") {
    return { kanaal: "Intern", zoekmachine: null };
  }
  for (const [patroon, naam] of zoekmachines) {
    if (patroon.test(host)) return { kanaal: "Organisch zoeken", zoekmachine: naam };
  }
  if (social.test(host)) return { kanaal: "Social", zoekmachine: null };
  if (webmail.test(host)) return { kanaal: "E-mail", zoekmachine: null };
  return { kanaal: "Verwijzing", zoekmachine: null };
}

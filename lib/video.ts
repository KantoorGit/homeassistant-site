// Video bij een artikel (W-ADM-19): een link naar YouTube, Vimeo of
// Dailymotion, of een videobestand (eigen upload of een https-adres dat
// eindigt op .mp4, .webm, .mov, .m4v of .ogv).

export type Video =
  | { soort: "youtube"; id: string; insluiten: string; miniatuur: string }
  | { soort: "vimeo"; id: string; insluiten: string; miniatuur: null }
  | { soort: "dailymotion"; id: string; insluiten: string; miniatuur: null }
  | { soort: "bestand"; id: string; bestand: string; miniatuur: null };

// Haalt de video-code uit een YouTube-adres (watch, youtu.be, shorts, embed).
export function youtubeId(adres: string | null | undefined): string | null {
  const v = videoInfo(adres);
  return v?.soort === "youtube" ? v.id : null;
}

const bestandsTypes = /\.(mp4|webm|mov|m4v|ogv)$/i;

export function videoInfo(adres: string | null | undefined): Video | null {
  if (!adres) return null;
  let url: URL;
  try {
    url = new URL(adres.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  // YouTube
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else id = /^\/(?:embed|shorts|live)\/([^/?#]+)/.exec(url.pathname)?.[1] ?? null;
  }
  if (id !== null) {
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return {
      soort: "youtube",
      id,
      insluiten: `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1`,
      miniatuur: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo: vimeo.com/123456789 of player.vimeo.com/video/123456789
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /^\/(?:video\/)?(\d{5,12})(?:\/([0-9a-f]{6,20}))?/.exec(url.pathname);
    if (!m) return null;
    const hash = m[2] ?? url.searchParams.get("h");
    return {
      soort: "vimeo",
      id: m[1],
      insluiten: `https://player.vimeo.com/video/${m[1]}?dnt=1${hash && /^[0-9a-f]+$/.test(hash) ? `&h=${hash}` : ""}`,
      miniatuur: null,
    };
  }

  // Dailymotion: dailymotion.com/video/x8abc12 of dai.ly/x8abc12
  if (host === "dailymotion.com" || host === "dai.ly") {
    const m =
      host === "dai.ly"
        ? /^\/([a-z0-9]{5,12})$/i.exec(url.pathname)
        : /^\/(?:embed\/)?video\/([a-z0-9]{5,12})/i.exec(url.pathname);
    if (!m) return null;
    return {
      soort: "dailymotion",
      id: m[1],
      insluiten: `https://www.dailymotion.com/embed/video/${m[1]}`,
      miniatuur: null,
    };
  }

  // Videobestand (bijvoorbeeld een eigen upload in Supabase Storage).
  if (bestandsTypes.test(url.pathname)) {
    return { soort: "bestand", id: url.pathname.split("/").pop() ?? "video", bestand: url.toString(), miniatuur: null };
  }
  return null;
}

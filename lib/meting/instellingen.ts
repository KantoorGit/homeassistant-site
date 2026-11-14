// Gedeelde instellingen van de meting (browser en server).

// Cookie met de keuze uit de cookiebanner: "ja.<versie>" of "nee.<versie>".
// Dit is een noodzakelijke cookie: hij onthoudt alleen de keuze, zodat de
// banner niet bij elk bezoek terugkomt.
export const toestemmingCookie = "toestemming";

// Cookie met de willekeurige bezoekerscode; alleen na "Accepteren"
// (W-ANA-41). Maximaal 13 maanden geldig.
export const bezoekerCookie = "bezoeker";
export const bezoekerCookieDagen = 395;

// Versie van de bannertekst. Verhoog dit getal als de tekst inhoudelijk
// verandert; bezoekers krijgen de banner dan opnieuw te zien.
export const bannerVersie = "1";

export const metingAdres = "/api/meting";

export type Gebeurtenis = {
  type:
    | "pagina"
    | "tijd"
    | "klik"
    | "scroll"
    | "video"
    | "training"
    | "taal"
    | "404"
    | "snelheid"
    | "doel"
    | "zoek";
  pad?: string;
  paginatype?: string;
  categorie?: string;
  artikel_id?: string;
  taal?: string;
  naam?: string;
  plek?: string;
  waarde?: number;
};

export type Verzending = {
  sitetaal?: string;
  scherm?: string;
  venster?: string;
  browsertaal?: string;
  // Alleen bij de eerste verzending na het laden van een pagina.
  herkomst?: { verwijzer: string; utm: Record<string, string> };
  gebeurtenissen?: Gebeurtenis[];
  toestemming?: { keuze: "accepteren" | "weigeren"; versie: string };
};

// Haalt persoonsgegevens en codes uit een adres (W-ANA-72): alleen het pad,
// zonder zoekdeel en zonder #-deel; e-mailadressen en lange codes worden
// vervangen.
export function schoonPad(pad: string): string {
  const zonder = pad.split(/[?#]/)[0] ?? "";
  return zonder
    .split("/")
    .map((deel) => {
      let d = deel;
      try {
        d = decodeURIComponent(deel);
      } catch {
        // laat staan
      }
      if (/@/.test(d)) return "(e-mail)";
      if (/^[A-Za-z0-9_-]{32,}$/.test(d) && /\d/.test(d) && /[A-Za-z]/.test(d)) return "(code)";
      return deel;
    })
    .join("/")
    .slice(0, 500);
}

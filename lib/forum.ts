import type { Taal } from "./site";

// De zes talen waarin gepost kan worden (W-FOR-02), ook al staat de
// interface nu alleen in het Nederlands en Engels.
export const postTalen = ["nl", "en", "zh", "fr", "de", "es"] as const;
export type PostTaal = (typeof postTalen)[number];

export function isPostTaal(waarde: unknown): waarde is PostTaal {
  return (postTalen as readonly unknown[]).includes(waarde);
}

export const postTaalNamen: Record<Taal, Record<PostTaal, string>> = {
  nl: {
    nl: "Nederlands",
    en: "Engels",
    zh: "Chinees",
    fr: "Frans",
    de: "Duits",
    es: "Spaans",
  },
  en: {
    nl: "Dutch",
    en: "English",
    zh: "Chinese",
    fr: "French",
    de: "German",
    es: "Spanish",
  },
};

// "Automatisch vertaald uit het Duits" / "... from German"
export const postTaalInZin: Record<Taal, Record<PostTaal, string>> = {
  nl: {
    nl: "het Nederlands",
    en: "het Engels",
    zh: "het Chinees",
    fr: "het Frans",
    de: "het Duits",
    es: "het Spaans",
  },
  en: postTaalNamen.en,
};

// Onderwerpen van het forum (W-FOR-05). De id staat in de database; het
// adres en de naam verschillen per taal.
export type Onderwerp = {
  id: string;
  slug: Record<Taal, string>;
  naam: Record<Taal, string>;
  uitleg: Record<Taal, string>;
};

export const onderwerpen: Onderwerp[] = [
  {
    id: "installatie",
    slug: { nl: "installatie", en: "installation" },
    naam: { nl: "Installatie", en: "Installation" },
    uitleg: {
      nl: "Home Assistant installeren, updaten en back-ups maken.",
      en: "Installing and updating Home Assistant, and making backups.",
    },
  },
  {
    id: "automatiseringen",
    slug: { nl: "automatiseringen", en: "automations" },
    naam: { nl: "Automatiseringen", en: "Automations" },
    uitleg: {
      nl: "Triggers, voorwaarden, acties, scripts en blueprints.",
      en: "Triggers, conditions, actions, scripts and blueprints.",
    },
  },
  {
    id: "dashboards",
    slug: { nl: "dashboards", en: "dashboards" },
    naam: { nl: "Dashboards", en: "Dashboards" },
    uitleg: {
      nl: "Kaarten, thema's en overzichten van je huis.",
      en: "Cards, themes and overviews of your home.",
    },
  },
  {
    id: "integraties",
    slug: { nl: "integraties", en: "integrations" },
    naam: { nl: "Integraties", en: "Integrations" },
    uitleg: {
      nl: "Apparaten en diensten koppelen.",
      en: "Connecting devices and services.",
    },
  },
  {
    id: "claude-en-ai",
    slug: { nl: "claude-en-ai", en: "claude-and-ai" },
    naam: { nl: "Claude & AI", en: "Claude & AI" },
    uitleg: {
      nl: "Claude en andere AI gebruiken om Home Assistant in te richten.",
      en: "Using Claude and other AI to set up Home Assistant.",
    },
  },
  {
    id: "hardware",
    slug: { nl: "hardware", en: "hardware" },
    naam: { nl: "Hardware", en: "Hardware" },
    uitleg: {
      nl: "Mini-pc's, Zigbee- en Matter-sticks, sensoren.",
      en: "Mini PCs, Zigbee and Matter dongles, sensors.",
    },
  },
  {
    id: "overig",
    slug: { nl: "overig", en: "other" },
    naam: { nl: "Overig", en: "Other" },
    uitleg: {
      nl: "Alles wat nergens anders past.",
      en: "Everything that doesn't fit elsewhere.",
    },
  },
];

export function vindOnderwerp(slug: string): Onderwerp | undefined {
  return onderwerpen.find((o) => Object.values(o.slug).includes(slug));
}

export function onderwerpPad(onderwerp: Onderwerp, taal: Taal): string {
  return `/${taal}/forum/${onderwerp.slug[taal]}`;
}

// Leesbaar stukje adres uit de titel ("Zigbee-stick niet gevonden" ->
// "zigbee-stick-niet-gevonden"). Bij Chinese titels blijft het leeg.
export function slugVan(titel: string): string {
  return titel
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function draadPad(
  taal: Taal,
  draad: { id: number; onderwerp: string; titel: string },
): string {
  const onderwerp =
    onderwerpen.find((o) => o.id === draad.onderwerp) ?? onderwerpen.at(-1)!;
  const slug = slugVan(draad.titel);
  return `${onderwerpPad(onderwerp, taal)}/${draad.id}${slug ? `-${slug}` : ""}`;
}

const tijdzone = "Europe/Amsterdam";

export function forumDatum(taal: Taal, iso: string): string {
  return new Intl.DateTimeFormat(taal, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tijdzone,
  }).format(new Date(iso));
}

export type Berichtstatus = "zichtbaar" | "wacht" | "verborgen" | "verwijderd";

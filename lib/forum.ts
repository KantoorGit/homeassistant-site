import { talen, teksten, type Taal } from "./site";

// De zes talen waarin gepost kan worden (W-FOR-02): dezelfde als de talen
// van de site.
export const postTalen = talen;
export type PostTaal = Taal;

export function isPostTaal(waarde: unknown): waarde is PostTaal {
  return (postTalen as readonly unknown[]).includes(waarde);
}

function hoofdletter(woord: string): string {
  return woord.charAt(0).toLocaleUpperCase() + woord.slice(1);
}

// Namen van de talen per taal van de site, met hoofdletter ("Duits",
// "Allemand", "德语").
export const postTaalNamen = Object.fromEntries(
  talen.map((taal) => [
    taal,
    Object.fromEntries(
      talen.map((p) => [p, hoofdletter(teksten[taal].taalNaam[p])]),
    ) as Record<PostTaal, string>,
  ]),
) as Record<Taal, Record<PostTaal, string>>;

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
    slug: { nl: "installatie", en: "installation", zh: "anzhuang", fr: "installation", de: "installation", es: "instalacion" },
    naam: { nl: "Installatie", en: "Installation", zh: "安装", fr: "Installation", de: "Installation", es: "Instalación" },
    uitleg: {
      nl: "Home Assistant installeren, updaten en back-ups maken.",
      en: "Installing and updating Home Assistant, and making backups.",
      zh: "安装和更新 Home Assistant，以及创建备份。",
      fr: "Installer et mettre à jour Home Assistant, et faire des sauvegardes.",
      de: "Home Assistant installieren, aktualisieren und Backups erstellen.",
      es: "Instalar y actualizar Home Assistant, y hacer copias de seguridad.",
    },
  },
  {
    id: "automatiseringen",
    slug: { nl: "automatiseringen", en: "automations", zh: "zidonghua", fr: "automatisations", de: "automatisierungen", es: "automatizaciones" },
    naam: { nl: "Automatiseringen", en: "Automations", zh: "自动化", fr: "Automatisations", de: "Automatisierungen", es: "Automatizaciones" },
    uitleg: {
      nl: "Triggers, voorwaarden, acties, scripts en blueprints.",
      en: "Triggers, conditions, actions, scripts and blueprints.",
      zh: "触发器、条件、动作、脚本和蓝图。",
      fr: "Déclencheurs, conditions, actions, scripts et blueprints.",
      de: "Auslöser, Bedingungen, Aktionen, Skripte und Blueprints.",
      es: "Disparadores, condiciones, acciones, scripts y blueprints.",
    },
  },
  {
    id: "dashboards",
    slug: { nl: "dashboards", en: "dashboards", zh: "yibiaopan", fr: "tableaux-de-bord", de: "dashboards", es: "paneles" },
    naam: { nl: "Dashboards", en: "Dashboards", zh: "仪表板", fr: "Tableaux de bord", de: "Dashboards", es: "Paneles" },
    uitleg: {
      nl: "Kaarten, thema's en overzichten van je huis.",
      en: "Cards, themes and overviews of your home.",
      zh: "卡片、主题和家居概览。",
      fr: "Cartes, thèmes et vues d'ensemble de votre maison.",
      de: "Karten, Themes und Übersichten deines Zuhauses.",
      es: "Tarjetas, temas y vistas generales de tu casa.",
    },
  },
  {
    id: "integraties",
    slug: { nl: "integraties", en: "integrations", zh: "jicheng", fr: "integrations", de: "integrationen", es: "integraciones" },
    naam: { nl: "Integraties", en: "Integrations", zh: "集成", fr: "Intégrations", de: "Integrationen", es: "Integraciones" },
    uitleg: {
      nl: "Apparaten en diensten koppelen.",
      en: "Connecting devices and services.",
      zh: "连接设备和服务。",
      fr: "Connecter des appareils et des services.",
      de: "Geräte und Dienste verbinden.",
      es: "Conectar dispositivos y servicios.",
    },
  },
  {
    id: "claude-en-ai",
    slug: { nl: "claude-en-ai", en: "claude-and-ai", zh: "claude-ai", fr: "claude-et-ia", de: "claude-und-ki", es: "claude-e-ia" },
    naam: { nl: "Claude & AI", en: "Claude & AI", zh: "Claude 与 AI", fr: "Claude & IA", de: "Claude & KI", es: "Claude e IA" },
    uitleg: {
      nl: "Claude en andere AI gebruiken om Home Assistant in te richten.",
      en: "Using Claude and other AI to set up Home Assistant.",
      zh: "使用 Claude 和其他 AI 配置 Home Assistant。",
      fr: "Utiliser Claude et d'autres IA pour configurer Home Assistant.",
      de: "Claude und andere KI nutzen, um Home Assistant einzurichten.",
      es: "Usar Claude y otras IA para configurar Home Assistant.",
    },
  },
  {
    id: "hardware",
    slug: { nl: "hardware", en: "hardware", zh: "yingjian", fr: "materiel", de: "hardware", es: "hardware" },
    naam: { nl: "Hardware", en: "Hardware", zh: "硬件", fr: "Matériel", de: "Hardware", es: "Hardware" },
    uitleg: {
      nl: "Mini-pc's, Zigbee- en Matter-sticks, sensoren.",
      en: "Mini PCs, Zigbee and Matter dongles, sensors.",
      zh: "迷你电脑、Zigbee 和 Matter 适配器、传感器。",
      fr: "Mini-PC, clés Zigbee et Matter, capteurs.",
      de: "Mini-PCs, Zigbee- und Matter-Sticks, Sensoren.",
      es: "Mini PC, adaptadores Zigbee y Matter, sensores.",
    },
  },
  {
    id: "overig",
    slug: { nl: "overig", en: "other", zh: "qita", fr: "autres", de: "sonstiges", es: "otros" },
    naam: { nl: "Overig", en: "Other", zh: "其他", fr: "Autres", de: "Sonstiges", es: "Otros" },
    uitleg: {
      nl: "Alles wat nergens anders past.",
      en: "Everything that doesn't fit elsewhere.",
      zh: "其他所有内容。",
      fr: "Tout ce qui ne rentre pas ailleurs.",
      de: "Alles, was nirgendwo sonst passt.",
      es: "Todo lo que no encaja en otro sitio.",
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

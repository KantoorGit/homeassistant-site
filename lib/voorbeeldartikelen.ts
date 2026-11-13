// Voorbeeldartikelen voor het skelet. Deze lijst verdwijnt zodra artikelen
// uit de Supabase-database komen (requirement W-ADM-07).

import type { Taal } from "./site";

export type Artikel = {
  id: string;
  categorieId: string;
  tijd: string; // weergave in de kolom "Laatste nieuws"
  kop: Record<Taal, string>;
  intro: Record<Taal, string>;
};

export const artikelen: Artikel[] = [
  {
    id: "bmax-installatie",
    categorieId: "training",
    tijd: "09:40",
    kop: {
      nl: "Home Assistant installeren op een Bmax mini-pc, stap voor stap",
      en: "Installing Home Assistant on a Bmax mini PC, step by step",
    },
    intro: {
      nl: "Van uitpakken tot het eerste dashboard: wat je nodig hebt, welke stappen je volgt en hoe je controleert of het gelukt is.",
      en: "From unboxing to your first dashboard: what you need, which steps to follow and how to check that it worked.",
    },
  },
  {
    id: "claude-automatisering",
    categorieId: "claude-en-ai",
    tijd: "09:12",
    kop: {
      nl: "Zo laat je Claude een automatisering voor je schrijven",
      en: "How to have Claude write an automation for you",
    },
    intro: {
      nl: "Beschrijf in gewone taal wat je wilt en laat Claude de YAML maken.",
      en: "Describe what you want in plain language and let Claude write the YAML.",
    },
  },
  {
    id: "eerste-dashboard",
    categorieId: "dashboards",
    tijd: "08:55",
    kop: {
      nl: "Je eerste dashboard in tien minuten",
      en: "Your first dashboard in ten minutes",
    },
    intro: {
      nl: "Met drie kaarten heb je al een overzicht van je hele huis.",
      en: "Three cards are enough for an overview of your whole home.",
    },
  },
  {
    id: "licht-bij-zonsondergang",
    categorieId: "automatiseringen",
    tijd: "08:30",
    kop: {
      nl: "Lampen aan bij zonsondergang: de eenvoudigste automatisering",
      en: "Lights on at sunset: the simplest automation",
    },
    intro: {
      nl: "Een goede eerste oefening om te zien hoe triggers en acties werken.",
      en: "A good first exercise to see how triggers and actions work.",
    },
  },
  {
    id: "zigbee-of-matter",
    categorieId: "hardware",
    tijd: "08:02",
    kop: {
      nl: "Zigbee of Matter: wat kies je voor nieuwe apparaten?",
      en: "Zigbee or Matter: what to pick for new devices?",
    },
    intro: {
      nl: "De verschillen op een rij, met advies per situatie.",
      en: "The differences side by side, with advice per situation.",
    },
  },
  {
    id: "slimme-meter",
    categorieId: "integraties",
    tijd: "07:45",
    kop: {
      nl: "De slimme meter koppelen via de P1-poort",
      en: "Connecting your smart meter through the P1 port",
    },
    intro: {
      nl: "Zie je stroom- en gasverbruik live in het energiedashboard.",
      en: "See your electricity and gas usage live in the energy dashboard.",
    },
  },
  {
    id: "wat-is-home-assistant",
    categorieId: "aan-de-slag",
    tijd: "07:20",
    kop: {
      nl: "Wat is Home Assistant en wat heb je ervoor nodig?",
      en: "What is Home Assistant and what do you need for it?",
    },
    intro: {
      nl: "Een korte uitleg voor wie nog nooit met domotica heeft gewerkt.",
      en: "A short explanation for anyone new to home automation.",
    },
  },
];

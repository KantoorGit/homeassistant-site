import type { Taal } from "@/lib/site";

// Teksten van de cookiebanner en de voettekst (W-ANA-70).
export const bannerTeksten: Record<
  Taal,
  {
    titel: string;
    uitleg: string;
    accepteren: string;
    weigeren: string;
    meerInfo: string;
    instellingen: string;
    privacy: string;
    huidigeKeuze: string;
    geaccepteerd: string;
    geweigerd: string;
    gpc: string;
  }
> = {
  nl: {
    titel: "Mag deze site je bezoek uitgebreider meten?",
    uitleg:
      "We meten altijd anoniem hoe de site wordt gebruikt, zonder cookies en zonder gegevens naar anderen. Met jouw toestemming plaatsen we één eigen cookie, zodat we ook zien of je terugkomt en welke stad je bezoekt. Je kunt je keuze altijd wijzigen.",
    accepteren: "Accepteren",
    weigeren: "Weigeren",
    meerInfo: "Meer in de privacy- en cookieverklaring",
    instellingen: "Cookie-instellingen",
    privacy: "Privacy en cookies",
    huidigeKeuze: "Je huidige keuze:",
    geaccepteerd: "geaccepteerd",
    geweigerd: "geweigerd",
    gpc: "Je browser vraagt om niet gevolgd te worden (Global Privacy Control). Daarom meten we alleen anoniem.",
  },
  en: {
    titel: "May this site measure your visit in more detail?",
    uitleg:
      "We always measure anonymously how the site is used, without cookies and without sharing data with others. With your permission we set one cookie of our own, so we can also see whether you come back and which city you visit from. You can change your choice at any time.",
    accepteren: "Accept",
    weigeren: "Decline",
    meerInfo: "More in the privacy and cookie statement",
    instellingen: "Cookie settings",
    privacy: "Privacy and cookies",
    huidigeKeuze: "Your current choice:",
    geaccepteerd: "accepted",
    geweigerd: "declined",
    gpc: "Your browser asks not to be tracked (Global Privacy Control), so we only measure anonymously.",
  },
  zh: {
    titel: "是否允许本网站更详细地统计您的访问？",
    uitleg:
      "我们始终以匿名方式统计网站的使用情况，不使用 Cookie，也不向他人提供数据。经您同意后，我们会设置一个自有 Cookie，以便了解您是否再次访问以及您所在的城市。您可以随时更改选择。",
    accepteren: "接受",
    weigeren: "拒绝",
    meerInfo: "详见隐私和 Cookie 声明",
    instellingen: "Cookie 设置",
    privacy: "隐私和 Cookie",
    huidigeKeuze: "您当前的选择：",
    geaccepteerd: "已接受",
    geweigerd: "已拒绝",
    gpc: "您的浏览器要求不被跟踪（全球隐私控制），因此我们只进行匿名统计。",
  },
  fr: {
    titel: "Ce site peut-il mesurer votre visite plus en détail ?",
    uitleg:
      "Nous mesurons toujours de façon anonyme l'utilisation du site, sans cookies et sans transmettre de données à des tiers. Avec votre accord, nous plaçons un seul cookie qui nous est propre, afin de voir aussi si vous revenez et depuis quelle ville vous nous rendez visite. Vous pouvez modifier votre choix à tout moment.",
    accepteren: "Accepter",
    weigeren: "Refuser",
    meerInfo: "En savoir plus dans la déclaration de confidentialité et de cookies",
    instellingen: "Paramètres des cookies",
    privacy: "Confidentialité et cookies",
    huidigeKeuze: "Votre choix actuel :",
    geaccepteerd: "accepté",
    geweigerd: "refusé",
    gpc: "Votre navigateur demande à ne pas être suivi (Global Privacy Control) ; nous mesurons donc uniquement de façon anonyme.",
  },
  de: {
    titel: "Darf diese Website deinen Besuch ausführlicher messen?",
    uitleg:
      "Wir messen immer anonym, wie die Website genutzt wird – ohne Cookies und ohne Daten an andere weiterzugeben. Mit deiner Zustimmung setzen wir ein eigenes Cookie, damit wir auch sehen, ob du wiederkommst und aus welcher Stadt du uns besuchst. Du kannst deine Wahl jederzeit ändern.",
    accepteren: "Akzeptieren",
    weigeren: "Ablehnen",
    meerInfo: "Mehr in der Datenschutz- und Cookie-Erklärung",
    instellingen: "Cookie-Einstellungen",
    privacy: "Datenschutz und Cookies",
    huidigeKeuze: "Deine aktuelle Wahl:",
    geaccepteerd: "akzeptiert",
    geweigerd: "abgelehnt",
    gpc: "Dein Browser bittet darum, nicht verfolgt zu werden (Global Privacy Control). Deshalb messen wir nur anonym.",
  },
  es: {
    titel: "¿Podemos medir tu visita con más detalle?",
    uitleg:
      "Siempre medimos de forma anónima cómo se usa el sitio, sin cookies y sin compartir datos con terceros. Con tu permiso colocamos una única cookie propia, para ver también si vuelves y desde qué ciudad nos visitas. Puedes cambiar tu elección en cualquier momento.",
    accepteren: "Aceptar",
    weigeren: "Rechazar",
    meerInfo: "Más información en la declaración de privacidad y cookies",
    instellingen: "Configuración de cookies",
    privacy: "Privacidad y cookies",
    huidigeKeuze: "Tu elección actual:",
    geaccepteerd: "aceptada",
    geweigerd: "rechazada",
    gpc: "Tu navegador pide no ser rastreado (Global Privacy Control), así que solo medimos de forma anónima.",
  },
};

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CookieInstellingenLink from "@/components/CookieInstellingenLink";
import { zelfdePadAlternatieven } from "@/lib/hreflang";
import { bannerTeksten } from "@/lib/meting/teksten";
import { isTaal, siteNaam, talen, type Taal } from "@/lib/site";

export async function generateStaticParams() {
  return talen.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  return { title: inhoud[lang].titel, alternates: zelfdePadAlternatieven(lang, "/privacy") };
}

// Privacy- en cookieverklaring (W-ANA-73). CONCEPT: vóór livegang
// juridisch laten toetsen (W-ANA-74).

type Blok = { kop: string; alineas: string[] };
type Inhoud = {
  titel: string;
  concept: string;
  blokken: Blok[];
  cookies: { kop: string; kolommen: [string, string, string, string]; rijen: string[][] };
};

const inhoud: Record<Taal, Inhoud> = {
  nl: {
    titel: "Privacy- en cookieverklaring",
    concept:
      "Concept – deze tekst wordt vóór de officiële lancering van de site juridisch gecontroleerd.",
    blokken: [
      {
        kop: "Wie zijn wij",
        alineas: [
          `${siteNaam} (www.winstonyip.com) is een onafhankelijke website over Home Assistant. De beheerder van de site is verantwoordelijk voor de verwerking van je gegevens. Een contactadres voor vragen over privacy volgt.`,
        ],
      },
      {
        kop: "Wat we altijd meten, zonder cookie",
        alineas: [
          "Om de site te verbeteren meten we anoniem hoe hij wordt gebruikt: welke pagina's en artikelen worden bekeken, hoe lang (alleen terwijl het tabblad zichtbaar is), waarop wordt geklikt, hoe ver een artikel wordt gelezen, het afspelen van video's, de laadsnelheid en via welke site of zoekmachine je binnenkwam (inclusief campagnecodes in het adres).",
          "We slaan daarbij op: browser, besturingssysteem, soort apparaat, schermgrootte, de taal van je browser en van de site, en land en regio. Land en regio worden afgeleid uit je IP-adres op het moment van bezoek; het IP-adres zelf slaan we nooit op.",
          "Om een bezoek van meerdere pagina's als één bezoek te tellen, maken we een anonieme code uit onder meer je IP-adres, je browser en een geheime sleutel die elke dag wordt vervangen en daarna gewist. Zo kunnen we je niet over meerdere dagen volgen. Hiervoor plaatsen we geen cookie.",
          "Deze meting gebeurt volledig in eigen beheer: er gaan geen gegevens naar Google, advertentienetwerken of sociale media.",
        ],
      },
      {
        kop: "Wat we meten na \"Accepteren\"",
        alineas: [
          "Kies je in de cookiebanner voor Accepteren, dan plaatsen we één eigen cookie met een willekeurige bezoekerscode (maximaal 13 maanden geldig). Daarmee zien we of je een nieuwe of terugkerende bezoeker bent, hoe vaak je terugkomt en welke pagina's je over meerdere bezoeken bekijkt. We slaan dan ook de stad op (afgeleid uit je IP-adres, dat we niet bewaren). Ben je ingelogd, dan koppelen we je bezoek aan je account.",
          "Kies je Weigeren, of vraagt je browser om niet gevolgd te worden (Global Privacy Control), dan meten we alleen anoniem zoals hierboven beschreven.",
        ],
      },
      {
        kop: "Wat we nooit opslaan",
        alineas: [
          "Je volledige IP-adres, e-mailadressen of andere persoonsgegevens uit adressen (codes uit e-maillinks, zoals voor wachtwoordherstel, halen we eruit), wat je in formulieren invult, wachtwoorden, en geen \"vingerafdruk\" van je browser.",
        ],
      },
      {
        kop: "Hoe lang we gegevens bewaren",
        alineas: [
          "Losse metingen bewaren we 14 maanden. Daarna houden we alleen opgetelde cijfers over (bijvoorbeeld aantal bezoeken per dag, per pagina of per land), die niet tot een persoon te herleiden zijn. Je keuze in de cookiebanner bewaren we met datum en versie van de tekst.",
        ],
      },
      {
        kop: "Waar de gegevens staan",
        alineas: [
          "De site draait bij Vercel en de database bij Supabase, beide in de Europese Unie (Frankfurt). Deze partijen verwerken de gegevens alleen in onze opdracht.",
        ],
      },
      {
        kop: "Je rechten",
        alineas: [
          "Je kunt je toestemming op elk moment intrekken via Cookie-instellingen onderaan elke pagina; de bezoekerscookie wordt dan direct verwijderd. Je hebt het recht om je gegevens in te zien, te laten corrigeren of verwijderen, en om bezwaar te maken. Heb je een klacht, dan kun je terecht bij de Autoriteit Persoonsgegevens.",
        ],
      },
      {
        kop: "Account en forum",
        alineas: [
          "Maak je een account, dan bewaren we je e-mailadres, gebruikersnaam, rol en de koppeling met je authenticator-app (tweestapsverificatie). Je berichten op het forum zijn openbaar en worden automatisch vertaald.",
        ],
      },
    ],
    cookies: {
      kop: "Cookies op deze site",
      kolommen: ["Naam", "Waarvoor", "Bewaard", "Toestemming nodig"],
      rijen: [
        ["toestemming", "Onthoudt je keuze in de cookiebanner", "13 maanden", "Nee (noodzakelijk)"],
        ["bezoeker", "Willekeurige bezoekerscode voor de uitgebreide meting", "13 maanden", "Ja"],
        ["taal", "Onthoudt de taal die je kiest", "1 jaar", "Nee (functioneel)"],
        ["sb-…-auth-token", "Houdt je ingelogd (alleen als je inlogt)", "Tot uitloggen", "Nee (noodzakelijk)"],
      ],
    },
  },
  en: {
    titel: "Privacy and cookie statement",
    concept: "Draft – this text will be legally reviewed before the site is officially launched.",
    blokken: [
      {
        kop: "Who we are",
        alineas: [
          `${siteNaam} (www.winstonyip.com) is an independent website about Home Assistant. The site's administrator is responsible for processing your data. A contact address for privacy questions will follow.`,
        ],
      },
      {
        kop: "What we always measure, without a cookie",
        alineas: [
          "To improve the site we measure anonymously how it is used: which pages and articles are viewed, for how long (only while the tab is visible), what is clicked, how far an article is read, video playback, loading speed, and which site or search engine you came from (including campaign codes in the address).",
          "We store your browser, operating system, type of device, screen size, the language of your browser and of the site, and your country and region. Country and region are derived from your IP address at the moment of your visit; we never store the IP address itself.",
          "To count a visit of several pages as one visit, we create an anonymous code from, among other things, your IP address, your browser and a secret key that is replaced every day and then deleted. This means we cannot follow you across several days. We do not set a cookie for this.",
          "This measurement is entirely under our own control: no data goes to Google, advertising networks or social media.",
        ],
      },
      {
        kop: "What we measure after \"Accept\"",
        alineas: [
          "If you choose Accept in the cookie banner, we set one cookie of our own with a random visitor code (valid for at most 13 months). With it we can see whether you are a new or returning visitor, how often you come back and which pages you view across several visits. We then also store your city (derived from your IP address, which we do not keep). If you are signed in, we link your visit to your account.",
          "If you choose Decline, or your browser asks not to be tracked (Global Privacy Control), we only measure anonymously as described above.",
        ],
      },
      {
        kop: "What we never store",
        alineas: [
          "Your full IP address, email addresses or other personal data from addresses (we remove codes from email links, such as password reset links), anything you type into forms, passwords, and no browser \"fingerprint\".",
        ],
      },
      {
        kop: "How long we keep data",
        alineas: [
          "We keep individual measurements for 14 months. After that we only keep totals (for example visits per day, per page or per country), which cannot be traced back to a person. We store your choice in the cookie banner with the date and version of the text.",
        ],
      },
      {
        kop: "Where the data is stored",
        alineas: [
          "The site runs on Vercel and the database on Supabase, both in the European Union (Frankfurt). These parties only process the data on our behalf.",
        ],
      },
      {
        kop: "Your rights",
        alineas: [
          "You can withdraw your consent at any time via Cookie settings at the bottom of every page; the visitor cookie is then deleted immediately. You have the right to access your data, to have it corrected or deleted, and to object. If you have a complaint, you can contact the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).",
        ],
      },
      {
        kop: "Account and forum",
        alineas: [
          "If you create an account, we store your email address, username, role and the link with your authenticator app (two-step verification). Your forum posts are public and are translated automatically.",
        ],
      },
    ],
    cookies: {
      kop: "Cookies on this site",
      kolommen: ["Name", "Purpose", "Kept for", "Consent required"],
      rijen: [
        ["toestemming", "Remembers your choice in the cookie banner", "13 months", "No (necessary)"],
        ["bezoeker", "Random visitor code for the detailed measurement", "13 months", "Yes"],
        ["taal", "Remembers the language you choose", "1 year", "No (functional)"],
        ["sb-…-auth-token", "Keeps you signed in (only if you sign in)", "Until you sign out", "No (necessary)"],
      ],
    },
  },
  zh: {
    titel: "隐私和 Cookie 声明",
    concept: "草案——本文本将在网站正式上线前接受法律审核。",
    blokken: [
      {
        kop: "我们是谁",
        alineas: [
          `${siteNaam}（www.winstonyip.com）是一个关于 Home Assistant 的独立网站。网站管理员负责处理您的数据。隐私问题联系地址将稍后公布。`,
        ],
      },
      {
        kop: "我们始终进行的统计（不使用 Cookie）",
        alineas: [
          "为改进网站，我们以匿名方式统计网站的使用情况：浏览了哪些页面和文章、浏览时长（仅在标签页可见时计算）、点击了什么、文章读到哪里、视频播放情况、加载速度，以及您是通过哪个网站或搜索引擎访问的（包括网址中的活动代码）。",
          "我们会保存：浏览器、操作系统、设备类型、屏幕尺寸、浏览器语言和网站语言，以及国家和地区。国家和地区是在访问时根据您的 IP 地址推断的；我们从不保存 IP 地址本身。",
          "为了将浏览多个页面计为一次访问，我们会根据您的 IP 地址、浏览器以及一个每天更换并随后删除的密钥等信息生成一个匿名代码。因此我们无法跨天跟踪您。为此我们不设置 Cookie。",
          "这项统计完全由我们自行管理：不会向 Google、广告网络或社交媒体传送任何数据。",
        ],
      },
      {
        kop: "点击“接受”后我们统计的内容",
        alineas: [
          "如果您在 Cookie 横幅中选择“接受”，我们会设置一个自有 Cookie，其中包含一个随机访客代码（最长有效 13 个月）。借此我们可以了解您是新访客还是回访者、回访频率，以及您在多次访问中浏览的页面。我们还会保存您所在的城市（根据 IP 地址推断，IP 地址不会保存）。如果您已登录，我们会将访问与您的账户关联。",
          "如果您选择“拒绝”，或者您的浏览器要求不被跟踪（全球隐私控制），我们只进行上述匿名统计。",
        ],
      },
      {
        kop: "我们从不保存的内容",
        alineas: [
          "完整的 IP 地址、电子邮件地址或网址中的其他个人信息（我们会删除邮件链接中的代码，例如重设密码的链接）、您在表单中填写的内容、密码，也不会采集浏览器“指纹”。",
        ],
      },
      {
        kop: "数据保存期限",
        alineas: [
          "单条统计数据保存 14 个月。之后我们只保留无法追溯到个人的汇总数据（例如每天、每个页面或每个国家的访问量）。您在 Cookie 横幅中的选择会连同日期和文本版本一起保存。",
        ],
      },
      {
        kop: "数据存放位置",
        alineas: [
          "网站运行在 Vercel，数据库位于 Supabase，两者均在欧盟境内（法兰克福）。这些服务商仅代表我们处理数据。",
        ],
      },
      {
        kop: "您的权利",
        alineas: [
          "您可以随时通过每个页面底部的“Cookie 设置”撤回同意，访客 Cookie 会立即删除。您有权查阅、更正或删除您的数据，并提出异议。如有投诉，可向荷兰数据保护局（Autoriteit Persoonsgegevens）提出。",
        ],
      },
      {
        kop: "账户和论坛",
        alineas: [
          "如果您创建账户，我们会保存您的电子邮件地址、用户名、角色以及与身份验证器应用（两步验证）的绑定信息。您在论坛上的帖子是公开的，并会自动翻译。",
        ],
      },
    ],
    cookies: {
      kop: "本网站使用的 Cookie",
      kolommen: ["名称", "用途", "保存期限", "是否需要同意"],
      rijen: [
        ["toestemming", "记住您在 Cookie 横幅中的选择", "13 个月", "否（必要）"],
        ["bezoeker", "用于详细统计的随机访客代码", "13 个月", "是"],
        ["taal", "记住您选择的语言", "1 年", "否（功能性）"],
        ["sb-…-auth-token", "保持登录状态（仅在您登录时）", "直到退出登录", "否（必要）"],
      ],
    },
  },
  fr: {
    titel: "Déclaration de confidentialité et de cookies",
    concept: "Projet – ce texte sera vérifié juridiquement avant le lancement officiel du site.",
    blokken: [
      {
        kop: "Qui sommes-nous",
        alineas: [
          `${siteNaam} (www.winstonyip.com) est un site indépendant consacré à Home Assistant. L'administrateur du site est responsable du traitement de vos données. Une adresse de contact pour les questions de confidentialité suivra.`,
        ],
      },
      {
        kop: "Ce que nous mesurons toujours, sans cookie",
        alineas: [
          "Pour améliorer le site, nous mesurons de façon anonyme son utilisation : pages et articles consultés, durée (uniquement lorsque l'onglet est visible), clics, jusqu'où un article est lu, lecture des vidéos, vitesse de chargement, et le site ou moteur de recherche par lequel vous êtes arrivé (y compris les codes de campagne dans l'adresse).",
          "Nous enregistrons : navigateur, système d'exploitation, type d'appareil, taille d'écran, langue du navigateur et du site, ainsi que pays et région. Le pays et la région sont déduits de votre adresse IP au moment de la visite ; nous n'enregistrons jamais l'adresse IP elle-même.",
          "Pour compter une visite de plusieurs pages comme une seule visite, nous créons un code anonyme à partir, entre autres, de votre adresse IP, de votre navigateur et d'une clé secrète remplacée chaque jour puis effacée. Nous ne pouvons donc pas vous suivre sur plusieurs jours. Nous ne plaçons pas de cookie pour cela.",
          "Cette mesure est entièrement gérée par nos soins : aucune donnée n'est transmise à Google, à des régies publicitaires ou aux réseaux sociaux.",
        ],
      },
      {
        kop: "Ce que nous mesurons après « Accepter »",
        alineas: [
          "Si vous choisissez Accepter dans la bannière, nous plaçons un seul cookie qui nous est propre, contenant un code visiteur aléatoire (valable 13 mois au maximum). Il nous permet de voir si vous êtes un nouveau visiteur ou un visiteur régulier, à quelle fréquence vous revenez et quelles pages vous consultez au fil de plusieurs visites. Nous enregistrons alors aussi la ville (déduite de votre adresse IP, que nous ne conservons pas). Si vous êtes connecté, nous associons votre visite à votre compte.",
          "Si vous choisissez Refuser, ou si votre navigateur demande à ne pas être suivi (Global Privacy Control), nous mesurons uniquement de façon anonyme comme décrit ci-dessus.",
        ],
      },
      {
        kop: "Ce que nous n'enregistrons jamais",
        alineas: [
          "Votre adresse IP complète, des adresses e-mail ou d'autres données personnelles figurant dans les adresses (nous retirons les codes des liens envoyés par e-mail, comme pour la réinitialisation du mot de passe), ce que vous saisissez dans les formulaires, les mots de passe, et aucune « empreinte » de votre navigateur.",
        ],
      },
      {
        kop: "Durée de conservation",
        alineas: [
          "Nous conservons les mesures individuelles pendant 14 mois. Ensuite, nous ne gardons que des totaux (par exemple le nombre de visites par jour, par page ou par pays), qui ne permettent pas d'identifier une personne. Votre choix dans la bannière est conservé avec la date et la version du texte.",
        ],
      },
      {
        kop: "Où sont stockées les données",
        alineas: [
          "Le site est hébergé chez Vercel et la base de données chez Supabase, tous deux dans l'Union européenne (Francfort). Ces prestataires traitent les données uniquement pour notre compte.",
        ],
      },
      {
        kop: "Vos droits",
        alineas: [
          "Vous pouvez retirer votre consentement à tout moment via Paramètres des cookies en bas de chaque page ; le cookie visiteur est alors supprimé immédiatement. Vous avez le droit d'accéder à vos données, de les faire rectifier ou supprimer, et de vous opposer à leur traitement. En cas de réclamation, vous pouvez vous adresser à l'autorité néerlandaise de protection des données (Autoriteit Persoonsgegevens).",
        ],
      },
      {
        kop: "Compte et forum",
        alineas: [
          "Si vous créez un compte, nous enregistrons votre adresse e-mail, votre nom d'utilisateur, votre rôle et l'association avec votre application d'authentification (vérification en deux étapes). Vos messages sur le forum sont publics et traduits automatiquement.",
        ],
      },
    ],
    cookies: {
      kop: "Cookies utilisés sur ce site",
      kolommen: ["Nom", "Finalité", "Durée", "Consentement requis"],
      rijen: [
        ["toestemming", "Retient votre choix dans la bannière", "13 mois", "Non (nécessaire)"],
        ["bezoeker", "Code visiteur aléatoire pour la mesure détaillée", "13 mois", "Oui"],
        ["taal", "Retient la langue choisie", "1 an", "Non (fonctionnel)"],
        ["sb-…-auth-token", "Vous garde connecté (seulement si vous vous connectez)", "Jusqu'à la déconnexion", "Non (nécessaire)"],
      ],
    },
  },
  de: {
    titel: "Datenschutz- und Cookie-Erklärung",
    concept: "Entwurf – dieser Text wird vor dem offiziellen Start der Website rechtlich geprüft.",
    blokken: [
      {
        kop: "Wer wir sind",
        alineas: [
          `${siteNaam} (www.winstonyip.com) ist eine unabhängige Website über Home Assistant. Verantwortlich für die Verarbeitung deiner Daten ist der Betreiber der Website. Eine Kontaktadresse für Datenschutzfragen folgt.`,
        ],
      },
      {
        kop: "Was wir immer messen, ohne Cookie",
        alineas: [
          "Um die Website zu verbessern, messen wir anonym, wie sie genutzt wird: welche Seiten und Artikel angesehen werden, wie lange (nur solange der Tab sichtbar ist), worauf geklickt wird, wie weit ein Artikel gelesen wird, das Abspielen von Videos, die Ladegeschwindigkeit und über welche Website oder Suchmaschine du gekommen bist (einschließlich Kampagnencodes in der Adresse).",
          "Dabei speichern wir: Browser, Betriebssystem, Geräteart, Bildschirmgröße, die Sprache deines Browsers und der Website sowie Land und Region. Land und Region werden zum Zeitpunkt des Besuchs aus deiner IP-Adresse abgeleitet; die IP-Adresse selbst speichern wir nie.",
          "Damit ein Besuch mehrerer Seiten als ein Besuch zählt, bilden wir einen anonymen Code unter anderem aus deiner IP-Adresse, deinem Browser und einem geheimen Schlüssel, der jeden Tag ersetzt und danach gelöscht wird. So können wir dich nicht über mehrere Tage verfolgen. Dafür setzen wir kein Cookie.",
          "Diese Messung erfolgt vollständig in eigener Verantwortung: Es gehen keine Daten an Google, Werbenetzwerke oder soziale Medien.",
        ],
      },
      {
        kop: "Was wir nach „Akzeptieren“ messen",
        alineas: [
          "Wählst du im Cookie-Banner Akzeptieren, setzen wir ein eigenes Cookie mit einem zufälligen Besuchercode (höchstens 13 Monate gültig). Damit sehen wir, ob du ein neuer oder wiederkehrender Besucher bist, wie oft du wiederkommst und welche Seiten du über mehrere Besuche hinweg ansiehst. Außerdem speichern wir dann die Stadt (abgeleitet aus deiner IP-Adresse, die wir nicht aufbewahren). Bist du angemeldet, verknüpfen wir deinen Besuch mit deinem Konto.",
          "Wählst du Ablehnen oder bittet dein Browser darum, nicht verfolgt zu werden (Global Privacy Control), messen wir nur anonym wie oben beschrieben.",
        ],
      },
      {
        kop: "Was wir nie speichern",
        alineas: [
          "Deine vollständige IP-Adresse, E-Mail-Adressen oder andere personenbezogene Daten aus Adressen (Codes aus E-Mail-Links, etwa zum Zurücksetzen des Passworts, entfernen wir), Formulareingaben, Passwörter und keinen „Fingerabdruck“ deines Browsers.",
        ],
      },
      {
        kop: "Wie lange wir Daten aufbewahren",
        alineas: [
          "Einzelne Messungen bewahren wir 14 Monate auf. Danach behalten wir nur zusammengefasste Zahlen (zum Beispiel Besuche pro Tag, pro Seite oder pro Land), die sich keiner Person zuordnen lassen. Deine Wahl im Cookie-Banner speichern wir mit Datum und Version des Textes.",
        ],
      },
      {
        kop: "Wo die Daten gespeichert werden",
        alineas: [
          "Die Website läuft bei Vercel und die Datenbank bei Supabase, beide in der Europäischen Union (Frankfurt). Diese Anbieter verarbeiten die Daten nur in unserem Auftrag.",
        ],
      },
      {
        kop: "Deine Rechte",
        alineas: [
          "Du kannst deine Einwilligung jederzeit über Cookie-Einstellungen unten auf jeder Seite widerrufen; das Besucher-Cookie wird dann sofort gelöscht. Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner Daten sowie auf Widerspruch. Bei Beschwerden kannst du dich an die niederländische Datenschutzbehörde (Autoriteit Persoonsgegevens) wenden.",
        ],
      },
      {
        kop: "Konto und Forum",
        alineas: [
          "Wenn du ein Konto erstellst, speichern wir deine E-Mail-Adresse, deinen Benutzernamen, deine Rolle und die Verknüpfung mit deiner Authenticator-App (Zwei-Faktor-Authentifizierung). Deine Beiträge im Forum sind öffentlich und werden automatisch übersetzt.",
        ],
      },
    ],
    cookies: {
      kop: "Cookies auf dieser Website",
      kolommen: ["Name", "Zweck", "Speicherdauer", "Einwilligung nötig"],
      rijen: [
        ["toestemming", "Merkt sich deine Wahl im Cookie-Banner", "13 Monate", "Nein (notwendig)"],
        ["bezoeker", "Zufälliger Besuchercode für die ausführliche Messung", "13 Monate", "Ja"],
        ["taal", "Merkt sich die gewählte Sprache", "1 Jahr", "Nein (funktional)"],
        ["sb-…-auth-token", "Hält dich angemeldet (nur wenn du dich anmeldest)", "Bis zur Abmeldung", "Nein (notwendig)"],
      ],
    },
  },
  es: {
    titel: "Declaración de privacidad y cookies",
    concept: "Borrador: este texto se revisará jurídicamente antes del lanzamiento oficial del sitio.",
    blokken: [
      {
        kop: "Quiénes somos",
        alineas: [
          `${siteNaam} (www.winstonyip.com) es un sitio web independiente sobre Home Assistant. El administrador del sitio es responsable del tratamiento de tus datos. Próximamente publicaremos una dirección de contacto para consultas sobre privacidad.`,
        ],
      },
      {
        kop: "Lo que siempre medimos, sin cookies",
        alineas: [
          "Para mejorar el sitio medimos de forma anónima cómo se usa: qué páginas y artículos se ven, durante cuánto tiempo (solo mientras la pestaña está visible), en qué se hace clic, hasta dónde se lee un artículo, la reproducción de vídeos, la velocidad de carga y desde qué sitio o buscador llegaste (incluidos los códigos de campaña de la dirección).",
          "Guardamos: navegador, sistema operativo, tipo de dispositivo, tamaño de pantalla, el idioma del navegador y del sitio, y el país y la región. El país y la región se deducen de tu dirección IP en el momento de la visita; nunca guardamos la dirección IP en sí.",
          "Para contar una visita de varias páginas como una sola visita, creamos un código anónimo a partir, entre otras cosas, de tu dirección IP, tu navegador y una clave secreta que se sustituye cada día y después se borra. Así no podemos seguirte a lo largo de varios días. Para ello no colocamos ninguna cookie.",
          "Esta medición la gestionamos íntegramente nosotros: no se envía ningún dato a Google, redes publicitarias ni redes sociales.",
        ],
      },
      {
        kop: "Lo que medimos tras «Aceptar»",
        alineas: [
          "Si eliges Aceptar en el banner de cookies, colocamos una única cookie propia con un código de visitante aleatorio (válido como máximo 13 meses). Con ella vemos si eres un visitante nuevo o recurrente, con qué frecuencia vuelves y qué páginas ves a lo largo de varias visitas. También guardamos la ciudad (deducida de tu dirección IP, que no conservamos). Si has iniciado sesión, vinculamos tu visita a tu cuenta.",
          "Si eliges Rechazar, o tu navegador pide no ser rastreado (Global Privacy Control), solo medimos de forma anónima como se describe arriba.",
        ],
      },
      {
        kop: "Lo que nunca guardamos",
        alineas: [
          "Tu dirección IP completa, direcciones de correo electrónico u otros datos personales que aparezcan en las direcciones (eliminamos los códigos de los enlaces enviados por correo, como los de restablecer la contraseña), lo que escribes en los formularios, contraseñas, ni ninguna «huella digital» de tu navegador.",
        ],
      },
      {
        kop: "Cuánto tiempo conservamos los datos",
        alineas: [
          "Conservamos las mediciones individuales durante 14 meses. Después solo mantenemos cifras agregadas (por ejemplo, visitas por día, por página o por país), que no permiten identificar a una persona. Guardamos tu elección en el banner de cookies con la fecha y la versión del texto.",
        ],
      },
      {
        kop: "Dónde se guardan los datos",
        alineas: [
          "El sitio funciona en Vercel y la base de datos en Supabase, ambos en la Unión Europea (Fráncfort). Estos proveedores solo tratan los datos por encargo nuestro.",
        ],
      },
      {
        kop: "Tus derechos",
        alineas: [
          "Puedes retirar tu consentimiento en cualquier momento desde Configuración de cookies, al pie de cada página; la cookie de visitante se elimina de inmediato. Tienes derecho a acceder a tus datos, a que se rectifiquen o eliminen y a oponerte a su tratamiento. Si tienes una queja, puedes dirigirte a la autoridad neerlandesa de protección de datos (Autoriteit Persoonsgegevens).",
        ],
      },
      {
        kop: "Cuenta y foro",
        alineas: [
          "Si creas una cuenta, guardamos tu correo electrónico, nombre de usuario, función y la vinculación con tu aplicación de autenticación (verificación en dos pasos). Tus mensajes en el foro son públicos y se traducen automáticamente.",
        ],
      },
    ],
    cookies: {
      kop: "Cookies de este sitio",
      kolommen: ["Nombre", "Finalidad", "Duración", "Requiere consentimiento"],
      rijen: [
        ["toestemming", "Recuerda tu elección en el banner de cookies", "13 meses", "No (necesaria)"],
        ["bezoeker", "Código de visitante aleatorio para la medición detallada", "13 meses", "Sí"],
        ["taal", "Recuerda el idioma que eliges", "1 año", "No (funcional)"],
        ["sb-…-auth-token", "Mantiene tu sesión iniciada (solo si inicias sesión)", "Hasta cerrar sesión", "No (necesaria)"],
      ],
    },
  },
};

export default async function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const tekst = inhoud[lang];
  return (
    <article className="artikel regels">
      <h1>{tekst.titel}</h1>
      <p className="vertaalmelding">{tekst.concept}</p>
      {tekst.blokken.map((blok) => (
        <section key={blok.kop}>
          <h2>{blok.kop}</h2>
          {blok.alineas.map((a) => (
            <p key={a}>{a}</p>
          ))}
        </section>
      ))}
      <section>
        <h2>{tekst.cookies.kop}</h2>
        <div className="tabel-scroll">
          <table className="cookietabel">
            <thead>
              <tr>
                {tekst.cookies.kolommen.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tekst.cookies.rijen.map((rij) => (
                <tr key={rij[0]}>
                  {rij.map((cel, i) => (
                    <td key={i}>{i === 0 ? <code>{cel}</code> : cel}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <CookieInstellingenLink tekst={bannerTeksten[lang].instellingen} />
        </p>
      </section>
    </article>
  );
}

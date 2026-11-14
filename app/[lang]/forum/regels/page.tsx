import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isTaal, siteNaam, talen, type Taal } from "@/lib/site";

export async function generateStaticParams() {
  return talen.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/forum/regels">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  return { title: inhoud[lang].titel };
}

// Forumregels en gebruiksvoorwaarden (W-JUR-03, -04). Concept: laat de
// tekst juridisch nalezen vóór livegang.
const inhoud: Record<Taal, { titel: string; blokken: { kop: string; regels: string[] }[] }> = {
  nl: {
    titel: "Forumregels en gebruiksvoorwaarden",
    blokken: [
      {
        kop: "Omgangsvormen",
        regels: [
          "Wees vriendelijk en geduldig: iedereen is ooit begonnen.",
          "Geen beledigingen, discriminatie, bedreigingen of intimidatie.",
          "Geen reclame, spam of links naar betaalde diensten zonder dat iemand erom vraagt.",
          "Deel geen persoonlijke gegevens van anderen, en wees voorzichtig met die van jezelf: haal wachtwoorden, tokens, IP-adressen en locaties uit je configuratie voordat je die plaatst.",
        ],
      },
      {
        kop: "Inhoud",
        regels: [
          "Plaats je vraag in het onderwerp waar hij het best past en geef een duidelijke titel.",
          "Zet code en configuratie tussen ``` zodat de opmaak behouden blijft.",
          "Je mag in het Nederlands, Engels, Chinees, Frans, Duits of Spaans schrijven. Berichten worden automatisch vertaald; het origineel blijft altijd te bekijken.",
          "Plaats alleen inhoud waarvan je de rechten hebt. Door te posten geef je " +
            siteNaam +
            " toestemming je bericht op deze site en in de bijbehorende app te tonen en te vertalen.",
        ],
      },
      {
        kop: "Account en beveiliging",
        regels: [
          "Voor posten heb je een account met een bevestigd e-mailadres en tweestapsverificatie nodig.",
          "Eén account per persoon. Je bent verantwoordelijk voor wat er met je account gebeurt.",
          "Je kunt je account en gegevens laten verwijderen.",
        ],
      },
      {
        kop: "Moderatie en melden",
        regels: [
          "Zie je een bericht dat niet deugt of onrechtmatig is? Gebruik de knop Melden bij het bericht. Een moderator bekijkt elke melding.",
          "Moderators kunnen berichten verbergen of verwijderen en accounts tijdelijk of blijvend blokkeren. Elke moderatie-actie wordt vastgelegd.",
          "Nieuwe of verdachte berichten (bijvoorbeeld met veel links) kunnen eerst op goedkeuring wachten.",
        ],
      },
      {
        kop: "Onafhankelijk",
        regels: [
          siteNaam +
            " is onafhankelijk en niet verbonden aan Home Assistant of Nabu Casa. Adviezen op het forum zijn van leden en worden gegeven zonder garantie.",
        ],
      },
    ],
  },
  en: {
    titel: "Forum rules and terms of use",
    blokken: [
      {
        kop: "Be kind",
        regels: [
          "Be friendly and patient: everyone was a beginner once.",
          "No insults, discrimination, threats or harassment.",
          "No advertising, spam or links to paid services unless someone asks for them.",
          "Don't share other people's personal data, and be careful with your own: remove passwords, tokens, IP addresses and locations from your configuration before posting it.",
        ],
      },
      {
        kop: "Content",
        regels: [
          "Post your question in the topic where it fits best and give it a clear title.",
          "Put code and configuration between ``` so the formatting is kept.",
          "You may write in Dutch, English, Chinese, French, German or Spanish. Posts are translated automatically; the original can always be viewed.",
          "Only post content you have the rights to. By posting you allow " +
            siteNaam +
            " to show and translate your post on this site and in the companion app.",
        ],
      },
      {
        kop: "Account and security",
        regels: [
          "To post you need an account with a confirmed email address and two-step verification.",
          "One account per person. You are responsible for what happens with your account.",
          "You can have your account and data deleted.",
        ],
      },
      {
        kop: "Moderation and reporting",
        regels: [
          "See a post that is inappropriate or unlawful? Use the Report button on the post. A moderator reviews every report.",
          "Moderators can hide or delete posts and block accounts temporarily or permanently. Every moderation action is logged.",
          "New or suspicious posts (for example with many links) may wait for approval first.",
        ],
      },
      {
        kop: "Independent",
        regels: [
          siteNaam +
            " is independent and not affiliated with Home Assistant or Nabu Casa. Advice on the forum comes from members and is given without warranty.",
        ],
      },
    ],
  },
  zh: {
    titel: "论坛规则和使用条款",
    blokken: [
      {
        kop: "友善交流",
        regels: [
          "请友善、耐心：每个人都曾是初学者。",
          "禁止侮辱、歧视、威胁或骚扰。",
          "禁止广告、垃圾信息，以及未经请求的付费服务链接。",
          "不要分享他人的个人信息，也要谨慎对待自己的信息：发布配置之前，请删除其中的密码、令牌、IP 地址和位置信息。",
        ],
      },
      {
        kop: "内容",
        regels: [
          "请将问题发布在最合适的主题下，并使用清晰的标题。",
          "请将代码和配置放在 ``` 之间，以保留格式。",
          "您可以用荷兰语、英语、中文、法语、德语或西班牙语发帖。帖子会自动翻译；原文始终可以查看。",
          "只发布您拥有权利的内容。发帖即表示您允许 " +
            siteNaam +
            " 在本网站及配套应用中显示和翻译您的帖子。",
        ],
      },
      {
        kop: "账户与安全",
        regels: [
          "发帖需要一个已确认电子邮件地址并开启两步验证的账户。",
          "每人一个账户。您需要对自己账户中发生的一切负责。",
          "您可以要求删除您的账户和数据。",
        ],
      },
      {
        kop: "管理与举报",
        regels: [
          "看到不当或违法的帖子？请使用帖子旁的“举报”按钮。版主会查看每一条举报。",
          "版主可以隐藏或删除帖子，并暂时或永久封禁账户。每一项管理操作都会被记录。",
          "新的或可疑的帖子（例如包含大量链接）可能需要先经过审核。",
        ],
      },
      {
        kop: "独立性",
        regels: [
          siteNaam +
            " 为独立网站，与 Home Assistant 或 Nabu Casa 无关。论坛中的建议来自会员，不提供任何保证。",
        ],
      },
    ],
  },
  fr: {
    titel: "Règles du forum et conditions d'utilisation",
    blokken: [
      {
        kop: "Savoir-vivre",
        regels: [
          "Soyez aimable et patient : tout le monde a été débutant un jour.",
          "Pas d'insultes, de discrimination, de menaces ni de harcèlement.",
          "Pas de publicité, de spam ni de liens vers des services payants sans que quelqu'un les demande.",
          "Ne partagez pas les données personnelles d'autrui et soyez prudent avec les vôtres : retirez mots de passe, jetons, adresses IP et localisations de votre configuration avant de la publier.",
        ],
      },
      {
        kop: "Contenu",
        regels: [
          "Publiez votre question dans le sujet le plus adapté et donnez-lui un titre clair.",
          "Placez le code et la configuration entre ``` pour conserver la mise en forme.",
          "Vous pouvez écrire en néerlandais, anglais, chinois, français, allemand ou espagnol. Les messages sont traduits automatiquement ; l'original reste toujours consultable.",
          "Ne publiez que du contenu dont vous détenez les droits. En publiant, vous autorisez " +
            siteNaam +
            " à afficher et traduire votre message sur ce site et dans l'application associée.",
        ],
      },
      {
        kop: "Compte et sécurité",
        regels: [
          "Pour publier, il faut un compte avec une adresse e-mail confirmée et la vérification en deux étapes.",
          "Un compte par personne. Vous êtes responsable de ce qui se passe avec votre compte.",
          "Vous pouvez faire supprimer votre compte et vos données.",
        ],
      },
      {
        kop: "Modération et signalement",
        regels: [
          "Vous voyez un message inapproprié ou illicite ? Utilisez le bouton Signaler du message. Un modérateur examine chaque signalement.",
          "Les modérateurs peuvent masquer ou supprimer des messages et bloquer des comptes temporairement ou définitivement. Chaque action de modération est enregistrée.",
          "Les messages nouveaux ou suspects (par exemple avec beaucoup de liens) peuvent d'abord attendre une approbation.",
        ],
      },
      {
        kop: "Indépendant",
        regels: [
          siteNaam +
            " est indépendant et n'est pas affilié à Home Assistant ni à Nabu Casa. Les conseils du forum proviennent des membres et sont donnés sans garantie.",
        ],
      },
    ],
  },
  de: {
    titel: "Forenregeln und Nutzungsbedingungen",
    blokken: [
      {
        kop: "Umgangsformen",
        regels: [
          "Sei freundlich und geduldig: Jeder hat einmal angefangen.",
          "Keine Beleidigungen, Diskriminierung, Drohungen oder Belästigung.",
          "Keine Werbung, kein Spam und keine Links zu kostenpflichtigen Diensten, ohne dass jemand danach fragt.",
          "Teile keine persönlichen Daten anderer und sei vorsichtig mit deinen eigenen: Entferne Passwörter, Tokens, IP-Adressen und Standorte aus deiner Konfiguration, bevor du sie veröffentlichst.",
        ],
      },
      {
        kop: "Inhalte",
        regels: [
          "Stelle deine Frage im passendsten Thema und gib ihr einen klaren Titel.",
          "Setze Code und Konfiguration zwischen ```, damit die Formatierung erhalten bleibt.",
          "Du darfst auf Niederländisch, Englisch, Chinesisch, Französisch, Deutsch oder Spanisch schreiben. Beiträge werden automatisch übersetzt; das Original bleibt immer einsehbar.",
          "Veröffentliche nur Inhalte, an denen du die Rechte hast. Mit dem Veröffentlichen erlaubst du " +
            siteNaam +
            ", deinen Beitrag auf dieser Website und in der zugehörigen App anzuzeigen und zu übersetzen.",
        ],
      },
      {
        kop: "Konto und Sicherheit",
        regels: [
          "Zum Schreiben brauchst du ein Konto mit bestätigter E-Mail-Adresse und Zwei-Faktor-Authentifizierung.",
          "Ein Konto pro Person. Du bist dafür verantwortlich, was mit deinem Konto geschieht.",
          "Du kannst dein Konto und deine Daten löschen lassen.",
        ],
      },
      {
        kop: "Moderation und Meldungen",
        regels: [
          "Du siehst einen unangemessenen oder rechtswidrigen Beitrag? Nutze den Button Melden beim Beitrag. Ein Moderator prüft jede Meldung.",
          "Moderatoren können Beiträge ausblenden oder löschen und Konten vorübergehend oder dauerhaft sperren. Jede Moderationsmaßnahme wird protokolliert.",
          "Neue oder verdächtige Beiträge (zum Beispiel mit vielen Links) können zuerst auf Freigabe warten.",
        ],
      },
      {
        kop: "Unabhängig",
        regels: [
          siteNaam +
            " ist unabhängig und steht in keiner Verbindung zu Home Assistant oder Nabu Casa. Ratschläge im Forum stammen von Mitgliedern und erfolgen ohne Gewähr.",
        ],
      },
    ],
  },
  es: {
    titel: "Normas del foro y condiciones de uso",
    blokken: [
      {
        kop: "Convivencia",
        regels: [
          "Sé amable y paciente: todo el mundo ha sido principiante alguna vez.",
          "Nada de insultos, discriminación, amenazas ni acoso.",
          "Nada de publicidad, spam ni enlaces a servicios de pago si nadie los pide.",
          "No compartas datos personales de otras personas y ten cuidado con los tuyos: elimina contraseñas, tokens, direcciones IP y ubicaciones de tu configuración antes de publicarla.",
        ],
      },
      {
        kop: "Contenido",
        regels: [
          "Publica tu pregunta en el tema que mejor encaje y ponle un título claro.",
          "Pon el código y la configuración entre ``` para conservar el formato.",
          "Puedes escribir en neerlandés, inglés, chino, francés, alemán o español. Los mensajes se traducen automáticamente; el original siempre se puede consultar.",
          "Publica solo contenido sobre el que tengas derechos. Al publicar, permites a " +
            siteNaam +
            " mostrar y traducir tu mensaje en este sitio y en la aplicación asociada.",
        ],
      },
      {
        kop: "Cuenta y seguridad",
        regels: [
          "Para publicar necesitas una cuenta con el correo electrónico confirmado y verificación en dos pasos.",
          "Una cuenta por persona. Eres responsable de lo que ocurra con tu cuenta.",
          "Puedes solicitar que se eliminen tu cuenta y tus datos.",
        ],
      },
      {
        kop: "Moderación y denuncias",
        regels: [
          "¿Ves un mensaje inapropiado o ilícito? Usa el botón Denunciar del mensaje. Un moderador revisa cada denuncia.",
          "Los moderadores pueden ocultar o eliminar mensajes y bloquear cuentas de forma temporal o permanente. Cada acción de moderación queda registrada.",
          "Los mensajes nuevos o sospechosos (por ejemplo, con muchos enlaces) pueden quedar pendientes de aprobación.",
        ],
      },
      {
        kop: "Independiente",
        regels: [
          siteNaam +
            " es independiente y no está vinculado a Home Assistant ni a Nabu Casa. Los consejos del foro proceden de los miembros y se ofrecen sin garantía.",
        ],
      },
    ],
  },
};

export default async function Regels({ params }: PageProps<"/[lang]/forum/regels">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const tekst = inhoud[lang];
  return (
    <article className="artikel regels">
      <h1>{tekst.titel}</h1>
      {tekst.blokken.map((blok) => (
        <section key={blok.kop}>
          <h2>{blok.kop}</h2>
          <ul>
            {blok.regels.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

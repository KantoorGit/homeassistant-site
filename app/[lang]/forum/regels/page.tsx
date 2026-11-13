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

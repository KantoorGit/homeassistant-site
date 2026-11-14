// Vaste teksten voor accounts en forum, per taal.
import type { Taal } from "./site";
import { de } from "./teksten-leden/de";
import { es } from "./teksten-leden/es";
import { fr } from "./teksten-leden/fr";
import { zh } from "./teksten-leden/zh";

const nl = {
  // Kopregel
  inloggen: "Inloggen",
  registreren: "Account maken",
  mijnAccount: "Mijn account",
  uitloggen: "Uitloggen",

  // Algemeen
  laden: "Bezig met laden…",
  bezig: "Even geduld…",
  opslaan: "Opslaan",
  doorgaan: "Doorgaan",
  terug: "Terug",
  email: "E-mailadres",
  wachtwoord: "Wachtwoord",
  wachtwoordHerhalen: "Wachtwoord herhalen",
  gebruikersnaam: "Gebruikersnaam",
  gebruikersnaamUitleg:
    "3 tot 30 tekens: letters, cijfers, punt, liggend streepje en underscore. Deze naam is openbaar.",
  wachtwoordUitleg: "Minimaal 10 tekens. Een zin van een paar woorden werkt goed.",
  verplicht2faUitleg:
    "Op deze site is tweestapsverificatie verplicht. Na het bevestigen van je e-mailadres koppel je een authenticator-app, zoals Google Authenticator, Microsoft Authenticator of 1Password.",

  // Registreren
  registrerenTitel: "Account maken",
  akkoordMet: "Ik ga akkoord met de",
  forumregels: "forumregels en gebruiksvoorwaarden",
  alAccount: "Heb je al een account?",
  controleerEmail:
    "Bijna klaar. We hebben je een e-mail gestuurd. Klik op de link in die e-mail om je adres te bevestigen; daarna stel je de authenticator-app in.",

  // Inloggen
  inloggenTitel: "Inloggen",
  nogGeenAccount: "Nog geen account?",
  wachtwoordVergetenLink: "Wachtwoord vergeten?",
  meldingen: {
    "link-ongeldig":
      "Deze link is verlopen of al gebruikt. Log in of vraag een nieuwe link aan.",
    "2fa-hersteld":
      "Je herstelcode is gebruikt en je authenticator-app is ontkoppeld. Log opnieuw in en koppel direct een nieuwe app.",
    uitgelogd: "Je bent uitgelogd.",
  } as Record<string, string>,

  // 2FA bij inloggen
  tweeFactorTitel: "Tweestapsverificatie",
  tweeFactorUitleg: "Open je authenticator-app en vul de code van 6 cijfers in.",
  code: "Code",
  bevestigen: "Bevestigen",
  geenToegangApp: "Geen toegang tot je app? Gebruik een herstelcode",

  // 2FA instellen
  instellenTitel: "Authenticator-app koppelen",
  instellenStap1:
    "Stap 1. Installeer een authenticator-app op je telefoon als je die nog niet hebt.",
  instellenStap2: "Stap 2. Scan deze QR-code met de app.",
  instellenStart: "QR-code tonen",
  instellenHandmatig: "Lukt scannen niet? Voer deze sleutel handmatig in:",
  instellenStap3: "Stap 3. Vul de code van 6 cijfers in die de app nu toont.",
  qrAlt: "QR-code voor de authenticator-app",

  // Herstelcodes
  herstelcodesTitel: "Je herstelcodes",
  herstelcodesUitleg:
    "Bewaar deze codes op een veilige plek, bijvoorbeeld in je wachtwoordbeheerder of op papier. Met één code kom je binnen als je je telefoon kwijt bent. Elke code werkt één keer. Je ziet ze maar één keer.",
  herstelcodesBewaard: "Ik heb de codes bewaard",
  herstelcodesKopieren: "Kopiëren",
  herstelcodesGekopieerd: "Gekopieerd",
  herstelcodesNietBeschikbaar:
    "2FA staat aan, maar herstelcodes konden niet worden gemaakt: de geheime serversleutel ontbreekt. Maak ze later aan via Mijn account.",
  herstelcodeTitel: "Inloggen met een herstelcode",
  herstelcodeUitleg:
    "Vul een van je herstelcodes in. Je authenticator-app wordt daarna ontkoppeld en je logt opnieuw in om een nieuwe app te koppelen.",
  herstelcode: "Herstelcode",
  herstelcodeGebruiken: "Herstelcode gebruiken",

  // Wachtwoord
  wachtwoordVergetenTitel: "Wachtwoord vergeten",
  wachtwoordVergetenUitleg:
    "Vul je e-mailadres in. Als er een account bij hoort, krijg je een e-mail met een link om een nieuw wachtwoord in te stellen.",
  stuurLink: "Stuur link",
  linkVerstuurd:
    "Als dit adres bij een account hoort, is er nu een e-mail onderweg. Kijk ook in je map met ongewenste e-mail.",
  nieuwWachtwoordTitel: "Nieuw wachtwoord instellen",
  nieuwWachtwoord: "Nieuw wachtwoord",
  wachtwoordGewijzigd: "Je wachtwoord is gewijzigd.",

  // Accountoverzicht
  accountTitel: "Mijn account",
  rol: "Rol",
  rollen: {
    lid: "Lid",
    redacteur: "Redacteur",
    moderator: "Moderator",
    beheerder: "Beheerder",
  } as Record<string, string>,
  tweeFactorStatus: "Tweestapsverificatie",
  aan: "Aan",
  herstelcodesResterend: "Ongebruikte herstelcodes",
  nieuweHerstelcodes: "Nieuwe herstelcodes maken",
  nieuweHerstelcodesUitleg: "De oude codes werken daarna niet meer.",
  wachtwoordWijzigen: "Wachtwoord wijzigen",
  naarForum: "Naar het forum",
  naarModeratie: "Naar moderatie",
  naarBeheer: "Naar het beheerpaneel",

  // Foutmeldingen
  fouten: {
    algemeen: "Er ging iets mis. Probeer het opnieuw.",
    geenDatabase:
      "De accountfuncties zijn nog niet klaar: de database mist de tabellen uit 004_accounts_en_forum.sql.",
    gebruikersnaam: "Kies een gebruikersnaam van 3 tot 30 tekens: letters, cijfers, . - _",
    gebruikersnaamBezet: "Deze gebruikersnaam is al in gebruik.",
    email: "Vul een geldig e-mailadres in.",
    wachtwoordKort: "Het wachtwoord moet minimaal 10 en maximaal 72 tekens hebben.",
    wachtwoordVerschil: "De twee wachtwoorden zijn niet gelijk.",
    wachtwoordZwak: "Dit wachtwoord is te zwak of komt voor in gelekte lijsten. Kies een ander.",
    wachtwoordZelfde: "Het nieuwe wachtwoord moet anders zijn dan het oude.",
    akkoord: "Ga akkoord met de forumregels om een account te maken.",
    inloggen: "E-mailadres of wachtwoord klopt niet.",
    nietBevestigd:
      "Je e-mailadres is nog niet bevestigd. Klik op de link in de e-mail die we je stuurden.",
    teVaak: "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.",
    botcontrole: "De controle tegen robots is mislukt. Probeer het opnieuw.",
    code: "Deze code klopt niet of is verlopen. Probeer de volgende code van de app.",
    codeVorm: "Vul de 6 cijfers uit de app in.",
    herstelcode: "Deze herstelcode klopt niet of is al gebruikt.",
    geenSleutel:
      "Dit kan nu niet: de geheime serversleutel van Supabase ontbreekt in de instellingen van Vercel.",
    nietIngelogd: "Je bent niet (meer) ingelogd.",
    opnieuwInloggen: "Log voor de zekerheid opnieuw in en probeer het daarna nog eens.",
  },

  // Forum
  forum: {
    titel: "Forum",
    intro:
      "Stel je vraag over Home Assistant of help een ander verder. Lezen kan iedereen; om te posten heb je een account met tweestapsverificatie nodig.",
    nieuweVraag: "Nieuwe vraag stellen",
    onderwerpen: "Onderwerpen",
    recent: "Recente discussies",
    geenDraden: "Hier zijn nog geen discussies. Stel de eerste vraag!",
    reacties: (n: number) => (n === 1 ? "1 reactie" : `${n} reacties`),
    door: "door",
    laatsteActiviteit: "Laatste activiteit",
    gesloten: "Gesloten",
    regelsLink: "Forumregels",
    nogNietBeschikbaar:
      "Het forum is nog niet klaar: de database mist de tabellen uit 004_accounts_en_forum.sql.",

    // Draad
    origineel: "Origineel",
    automatischVertaald: "Automatisch vertaald uit",
    nogNietVertaald: "nog niet vertaald",
    origineelTonen: "Origineel bekijken",
    reageren: "Reageren",
    jouwReactie: "Jouw reactie",
    plaatsen: "Plaatsen",
    inloggenOmTeReageren: "Log in om te reageren",
    draadGesloten: "Deze discussie is gesloten; reageren kan niet meer.",
    melden: "Melden",
    meldReden: "Waarom meld je dit bericht?",
    meldVersturen: "Melding versturen",
    gemeld: "Bedankt. Een moderator bekijkt je melding.",
    verwijderen: "Verwijderen",
    verwijderenBevestig: "Dit bericht verwijderen",
    wachtOpGoedkeuring:
      "Dit bericht wacht op goedkeuring door een moderator en is nog niet zichtbaar voor anderen.",
    verborgen: "Verborgen door een moderator",
    codeUitleg:
      "Tip: zet code tussen ``` op een eigen regel, dan blijft de opmaak behouden en wordt de code nooit vertaald.",
    bewerkt: "bewerkt",

    // Nieuw
    nieuwTitel: "Nieuwe vraag stellen",
    onderwerp: "Onderwerp",
    titelVeld: "Titel",
    titelUitleg: "Vat je vraag samen in één zin (5 tot 150 tekens).",
    tekst: "Je vraag",
    taalVeld: "Taal van je bericht",
    taalUitleg: "Andere bezoekers lezen je bericht in hun eigen taal.",

    // Moderatie
    moderatieTitel: "Moderatie",
    openMeldingen: "Open meldingen",
    geenMeldingen: "Er zijn geen open meldingen.",
    wachtend: "Wachten op goedkeuring",
    geenWachtend: "Er wachten geen berichten.",
    logboek: "Logboek",
    blokkades: "Actieve blokkades",
    geenBlokkades: "Niemand is geblokkeerd.",
    gemeldDoor: "gemeld door",
    tonen: "Goedkeuren / tonen",
    verbergen: "Verbergen",
    afwijzen: "Melding afwijzen",
    blokkeer7: "Auteur 7 dagen blokkeren",
    blokkeerPermanent: "Auteur permanent blokkeren",
    deblokkeren: "Blokkade opheffen",
    tot: "tot",
    permanent: "permanent",
    sluiten: "Discussie sluiten",
    openen: "Discussie heropenen",
    geenToegang: "Deze pagina is alleen voor moderators en beheerders.",
    status: "Status",
    vertalenNaar: "Ook automatisch vertalen naar",
    plaatsenEnVertalen: (n: number) => (n === 1 ? "Plaatsen en vertalen naar 1 taal" : `Plaatsen en vertalen naar ${n} talen`),
    alleenPlaatsenIn: (taal: string) => `Alleen in het ${taal} plaatsen`,
    vertaalknop: "Vertalen naar andere talen",
    vertaalStarten: (n: number) => (n === 1 ? "Vertalen naar 1 taal" : `Vertalen naar ${n} talen`),
    vertaalGestart: "De vertaling staat in de wachtrij en verschijnt vanzelf zodra ze klaar is.",
    vertaalStatus: (wacht: number, mislukt: number) =>
      [wacht ? `${wacht} vertaling(en) in de wachtrij` : "", mislukt ? `${mislukt} vertaling(en) mislukt – probeer het opnieuw met de vertaalknop` : ""].filter(Boolean).join(" · "),
    bewerken: "Bewerken",
    bewerkenOpslaan: "Wijziging opslaan",
    bewerktMelding: "Je bericht is gewijzigd. De vertalingen zijn nog van de vorige versie: werk ze bij met \"Vertalen naar andere talen\".",
    vertalingVerouderd: "Deze vertaling hoort bij een eerdere versie van het bericht.",
  },

  forumFouten: {
    NIET_INGELOGD: "Je bent niet ingelogd.",
    GEEN_2FA: "Bevestig eerst je inlog met de authenticator-app.",
    GEEN_PROFIEL: "Je account heeft nog geen profiel. Log opnieuw in.",
    GEBLOKKEERD: "Je account is (tijdelijk) geblokkeerd voor het forum.",
    LIMIET_BERICHTEN:
      "Je hebt veel berichten kort na elkaar geplaatst. Wacht even en probeer het opnieuw.",
    LIMIET_DRADEN: "Je kunt maximaal 3 nieuwe vragen per uur stellen.",
    LIMIET_MELDINGEN: "Je hebt vandaag al veel meldingen gedaan.",
    DRAAD_ONBEKEND: "Deze discussie bestaat niet (meer).",
    DRAAD_GESLOTEN: "Deze discussie is gesloten.",
    BERICHT_ONBEKEND: "Dit bericht bestaat niet (meer).",
    NIET_TOEGESTAAN: "Dat mag niet.",
    GEEN_MODERATOR: "Alleen moderators kunnen dit doen.",
    TITEL: "De titel moet 5 tot 150 tekens hebben.",
    TEKST: "Je bericht moet 2 tot 20.000 tekens hebben.",
    REDEN: "Geef een reden van 3 tot 1000 tekens.",
    ONDERWERP: "Kies een onderwerp.",
  } as Record<string, string>,
};

export type Teksten = typeof nl;

const en: Teksten = {
  inloggen: "Sign in",
  registreren: "Create account",
  mijnAccount: "My account",
  uitloggen: "Sign out",

  laden: "Loading…",
  bezig: "Please wait…",
  opslaan: "Save",
  doorgaan: "Continue",
  terug: "Back",
  email: "Email address",
  wachtwoord: "Password",
  wachtwoordHerhalen: "Repeat password",
  gebruikersnaam: "Username",
  gebruikersnaamUitleg:
    "3 to 30 characters: letters, digits, dot, hyphen and underscore. This name is public.",
  wachtwoordUitleg: "At least 10 characters. A sentence of a few words works well.",
  verplicht2faUitleg:
    "Two-step verification is required on this site. After confirming your email address you link an authenticator app, such as Google Authenticator, Microsoft Authenticator or 1Password.",

  registrerenTitel: "Create account",
  akkoordMet: "I agree to the",
  forumregels: "forum rules and terms of use",
  alAccount: "Already have an account?",
  controleerEmail:
    "Almost done. We have sent you an email. Click the link in that email to confirm your address; then you will set up the authenticator app.",

  inloggenTitel: "Sign in",
  nogGeenAccount: "No account yet?",
  wachtwoordVergetenLink: "Forgot your password?",
  meldingen: {
    "link-ongeldig":
      "This link has expired or has already been used. Sign in or request a new link.",
    "2fa-hersteld":
      "Your recovery code has been used and your authenticator app has been unlinked. Sign in again and link a new app straight away.",
    uitgelogd: "You have been signed out.",
  },

  tweeFactorTitel: "Two-step verification",
  tweeFactorUitleg: "Open your authenticator app and enter the 6-digit code.",
  code: "Code",
  bevestigen: "Confirm",
  geenToegangApp: "No access to your app? Use a recovery code",

  instellenTitel: "Link an authenticator app",
  instellenStap1: "Step 1. Install an authenticator app on your phone if you don't have one yet.",
  instellenStap2: "Step 2. Scan this QR code with the app.",
  instellenStart: "Show QR code",
  instellenHandmatig: "Can't scan? Enter this key manually:",
  instellenStap3: "Step 3. Enter the 6-digit code the app is showing now.",
  qrAlt: "QR code for the authenticator app",

  herstelcodesTitel: "Your recovery codes",
  herstelcodesUitleg:
    "Keep these codes somewhere safe, for example in your password manager or on paper. One code gets you in if you lose your phone. Each code works once. You will only see them once.",
  herstelcodesBewaard: "I have saved the codes",
  herstelcodesKopieren: "Copy",
  herstelcodesGekopieerd: "Copied",
  herstelcodesNietBeschikbaar:
    "2FA is on, but recovery codes could not be created because the secret server key is missing. Create them later under My account.",
  herstelcodeTitel: "Sign in with a recovery code",
  herstelcodeUitleg:
    "Enter one of your recovery codes. Your authenticator app will then be unlinked and you sign in again to link a new app.",
  herstelcode: "Recovery code",
  herstelcodeGebruiken: "Use recovery code",

  wachtwoordVergetenTitel: "Forgot password",
  wachtwoordVergetenUitleg:
    "Enter your email address. If it belongs to an account, you will receive an email with a link to set a new password.",
  stuurLink: "Send link",
  linkVerstuurd:
    "If this address belongs to an account, an email is on its way. Please also check your spam folder.",
  nieuwWachtwoordTitel: "Set a new password",
  nieuwWachtwoord: "New password",
  wachtwoordGewijzigd: "Your password has been changed.",

  accountTitel: "My account",
  rol: "Role",
  rollen: {
    lid: "Member",
    redacteur: "Editor",
    moderator: "Moderator",
    beheerder: "Administrator",
  },
  tweeFactorStatus: "Two-step verification",
  aan: "On",
  herstelcodesResterend: "Unused recovery codes",
  nieuweHerstelcodes: "Create new recovery codes",
  nieuweHerstelcodesUitleg: "The old codes will stop working.",
  wachtwoordWijzigen: "Change password",
  naarForum: "Go to the forum",
  naarModeratie: "Go to moderation",
  naarBeheer: "Go to the admin panel",

  fouten: {
    algemeen: "Something went wrong. Please try again.",
    geenDatabase:
      "Account features are not ready yet: the database is missing the tables from 004_accounts_en_forum.sql.",
    gebruikersnaam: "Choose a username of 3 to 30 characters: letters, digits, . - _",
    gebruikersnaamBezet: "This username is already taken.",
    email: "Enter a valid email address.",
    wachtwoordKort: "The password must be between 10 and 72 characters.",
    wachtwoordVerschil: "The two passwords do not match.",
    wachtwoordZwak: "This password is too weak or appears in leaked lists. Choose another one.",
    wachtwoordZelfde: "The new password must differ from the old one.",
    akkoord: "Please agree to the forum rules to create an account.",
    inloggen: "Email address or password is incorrect.",
    nietBevestigd:
      "Your email address has not been confirmed yet. Click the link in the email we sent you.",
    teVaak: "Too many attempts. Wait a few minutes and try again.",
    botcontrole: "The robot check failed. Please try again.",
    code: "This code is incorrect or has expired. Try the next code from the app.",
    codeVorm: "Enter the 6 digits from the app.",
    herstelcode: "This recovery code is incorrect or has already been used.",
    geenSleutel:
      "This is not possible right now: the Supabase secret server key is missing from the Vercel settings.",
    nietIngelogd: "You are not (or no longer) signed in.",
    opnieuwInloggen: "Please sign in again to be safe, then try once more.",
  },

  forum: {
    titel: "Forum",
    intro:
      "Ask your Home Assistant question or help someone else. Anyone can read; to post you need an account with two-step verification.",
    nieuweVraag: "Ask a new question",
    onderwerpen: "Topics",
    recent: "Recent discussions",
    geenDraden: "No discussions here yet. Ask the first question!",
    reacties: (n: number) => (n === 1 ? "1 reply" : `${n} replies`),
    door: "by",
    laatsteActiviteit: "Last activity",
    gesloten: "Closed",
    regelsLink: "Forum rules",
    nogNietBeschikbaar:
      "The forum is not ready yet: the database is missing the tables from 004_accounts_en_forum.sql.",

    origineel: "Original",
    automatischVertaald: "Automatically translated from",
    nogNietVertaald: "not translated yet",
    origineelTonen: "View original",
    reageren: "Reply",
    jouwReactie: "Your reply",
    plaatsen: "Post",
    inloggenOmTeReageren: "Sign in to reply",
    draadGesloten: "This discussion is closed; replies are no longer possible.",
    melden: "Report",
    meldReden: "Why are you reporting this post?",
    meldVersturen: "Send report",
    gemeld: "Thank you. A moderator will look at your report.",
    verwijderen: "Delete",
    verwijderenBevestig: "Delete this post",
    wachtOpGoedkeuring:
      "This post is waiting for approval by a moderator and is not yet visible to others.",
    verborgen: "Hidden by a moderator",
    codeUitleg:
      "Tip: put code between ``` on a line of its own; the formatting is kept and the code is never translated.",
    bewerkt: "edited",

    nieuwTitel: "Ask a new question",
    onderwerp: "Topic",
    titelVeld: "Title",
    titelUitleg: "Summarise your question in one sentence (5 to 150 characters).",
    tekst: "Your question",
    taalVeld: "Language of your post",
    taalUitleg: "Other visitors read your post in their own language.",

    moderatieTitel: "Moderation",
    openMeldingen: "Open reports",
    geenMeldingen: "There are no open reports.",
    wachtend: "Awaiting approval",
    geenWachtend: "No posts are waiting.",
    logboek: "Log",
    blokkades: "Active blocks",
    geenBlokkades: "Nobody is blocked.",
    gemeldDoor: "reported by",
    tonen: "Approve / show",
    verbergen: "Hide",
    afwijzen: "Dismiss report",
    blokkeer7: "Block author for 7 days",
    blokkeerPermanent: "Block author permanently",
    deblokkeren: "Lift block",
    tot: "until",
    permanent: "permanent",
    sluiten: "Close discussion",
    openen: "Reopen discussion",
    geenToegang: "This page is for moderators and administrators only.",
    status: "Status",
    vertalenNaar: "Also translate automatically into",
    plaatsenEnVertalen: (n: number) => (n === 1 ? "Post and translate into 1 language" : `Post and translate into ${n} languages`),
    alleenPlaatsenIn: (taal: string) => `Post in ${taal} only`,
    vertaalknop: "Translate into other languages",
    vertaalStarten: (n: number) => (n === 1 ? "Translate into 1 language" : `Translate into ${n} languages`),
    vertaalGestart: "The translation is in the queue and will appear automatically once it is ready.",
    vertaalStatus: (wacht: number, mislukt: number) =>
      [wacht ? `${wacht} translation(s) in the queue` : "", mislukt ? `${mislukt} translation(s) failed – try again with the translate button` : ""].filter(Boolean).join(" · "),
    bewerken: "Edit",
    bewerkenOpslaan: "Save changes",
    bewerktMelding: "Your post has been changed. The translations are still of the previous version: update them with \"Translate into other languages\".",
    vertalingVerouderd: "This translation belongs to an earlier version of the post.",
  },

  forumFouten: {
    NIET_INGELOGD: "You are not signed in.",
    GEEN_2FA: "Please confirm your sign-in with the authenticator app first.",
    GEEN_PROFIEL: "Your account has no profile yet. Please sign in again.",
    GEBLOKKEERD: "Your account is (temporarily) blocked from the forum.",
    LIMIET_BERICHTEN:
      "You have posted a lot in a short time. Please wait a moment and try again.",
    LIMIET_DRADEN: "You can ask at most 3 new questions per hour.",
    LIMIET_MELDINGEN: "You have already sent many reports today.",
    DRAAD_ONBEKEND: "This discussion does not exist (anymore).",
    DRAAD_GESLOTEN: "This discussion is closed.",
    BERICHT_ONBEKEND: "This post does not exist (anymore).",
    NIET_TOEGESTAAN: "That is not allowed.",
    GEEN_MODERATOR: "Only moderators can do this.",
    TITEL: "The title must be 5 to 150 characters.",
    TEKST: "Your post must be 2 to 20,000 characters.",
    REDEN: "Give a reason of 3 to 1000 characters.",
    ONDERWERP: "Choose a topic.",
  },
};

export const ledenTeksten: Record<Taal, Teksten> = { nl, en, zh, fr, de, es };

// Zet een foutcode uit de database om in een leesbare tekst.
export function forumFout(taal: Taal, bericht: string | undefined | null): string {
  const t = ledenTeksten[taal];
  if (!bericht) return t.fouten.algemeen;
  for (const [code, tekst] of Object.entries(t.forumFouten)) {
    if (bericht.includes(code)) return tekst;
  }
  return t.fouten.algemeen;
}

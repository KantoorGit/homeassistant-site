// Vaste teksten voor accounts en forum: Duits.
import type { Teksten } from "../teksten-leden";

export const de: Teksten = {
  inloggen: "Anmelden",
  registreren: "Konto erstellen",
  mijnAccount: "Mein Konto",
  uitloggen: "Abmelden",

  laden: "Wird geladen…",
  bezig: "Einen Moment bitte…",
  opslaan: "Speichern",
  doorgaan: "Weiter",
  terug: "Zurück",
  email: "E-Mail-Adresse",
  wachtwoord: "Passwort",
  wachtwoordHerhalen: "Passwort wiederholen",
  gebruikersnaam: "Benutzername",
  gebruikersnaamUitleg:
    "3 bis 30 Zeichen: Buchstaben, Ziffern, Punkt, Bindestrich und Unterstrich. Dieser Name ist öffentlich.",
  wachtwoordUitleg: "Mindestens 10 Zeichen. Ein Satz aus ein paar Wörtern funktioniert gut.",
  verplicht2faUitleg:
    "Auf dieser Website ist die Zwei-Faktor-Authentifizierung Pflicht. Nach der Bestätigung deiner E-Mail-Adresse verknüpfst du eine Authenticator-App, zum Beispiel Google Authenticator, Microsoft Authenticator oder 1Password.",

  registrerenTitel: "Konto erstellen",
  akkoordMet: "Ich akzeptiere die",
  forumregels: "Forenregeln und Nutzungsbedingungen",
  alAccount: "Du hast schon ein Konto?",
  controleerEmail:
    "Fast geschafft. Wir haben dir eine E-Mail geschickt. Klicke auf den Link in der E-Mail, um deine Adresse zu bestätigen; danach richtest du die Authenticator-App ein.",

  inloggenTitel: "Anmelden",
  nogGeenAccount: "Noch kein Konto?",
  wachtwoordVergetenLink: "Passwort vergessen?",
  meldingen: {
    "link-ongeldig":
      "Dieser Link ist abgelaufen oder wurde bereits verwendet. Melde dich an oder fordere einen neuen Link an.",
    "2fa-hersteld":
      "Dein Wiederherstellungscode wurde verwendet und deine Authenticator-App wurde entfernt. Melde dich erneut an und verknüpfe sofort eine neue App.",
    uitgelogd: "Du bist abgemeldet.",
  },

  tweeFactorTitel: "Zwei-Faktor-Authentifizierung",
  tweeFactorUitleg: "Öffne deine Authenticator-App und gib den 6-stelligen Code ein.",
  code: "Code",
  bevestigen: "Bestätigen",
  geenToegangApp: "Kein Zugriff auf deine App? Wiederherstellungscode verwenden",

  instellenTitel: "Authenticator-App verknüpfen",
  instellenStap1:
    "Schritt 1. Installiere eine Authenticator-App auf deinem Telefon, falls du noch keine hast.",
  instellenStap2: "Schritt 2. Scanne diesen QR-Code mit der App.",
  instellenStart: "QR-Code anzeigen",
  instellenHandmatig: "Scannen klappt nicht? Gib diesen Schlüssel manuell ein:",
  instellenStap3: "Schritt 3. Gib den 6-stelligen Code ein, den die App jetzt anzeigt.",
  qrAlt: "QR-Code für die Authenticator-App",

  herstelcodesTitel: "Deine Wiederherstellungscodes",
  herstelcodesUitleg:
    "Bewahre diese Codes sicher auf, zum Beispiel in deinem Passwort-Manager oder auf Papier. Mit einem Code kommst du hinein, wenn du dein Telefon verlierst. Jeder Code funktioniert nur einmal. Du siehst sie nur ein einziges Mal.",
  herstelcodesBewaard: "Ich habe die Codes gespeichert",
  herstelcodesKopieren: "Kopieren",
  herstelcodesGekopieerd: "Kopiert",
  herstelcodesNietBeschikbaar:
    "2FA ist aktiv, aber Wiederherstellungscodes konnten nicht erstellt werden: Der geheime Serverschlüssel fehlt. Erstelle sie später unter Mein Konto.",
  herstelcodeTitel: "Mit einem Wiederherstellungscode anmelden",
  herstelcodeUitleg:
    "Gib einen deiner Wiederherstellungscodes ein. Deine Authenticator-App wird danach entfernt, und du meldest dich erneut an, um eine neue App zu verknüpfen.",
  herstelcode: "Wiederherstellungscode",
  herstelcodeGebruiken: "Wiederherstellungscode verwenden",

  wachtwoordVergetenTitel: "Passwort vergessen",
  wachtwoordVergetenUitleg:
    "Gib deine E-Mail-Adresse ein. Gehört sie zu einem Konto, erhältst du eine E-Mail mit einem Link, um ein neues Passwort festzulegen.",
  stuurLink: "Link senden",
  linkVerstuurd:
    "Wenn diese Adresse zu einem Konto gehört, ist jetzt eine E-Mail unterwegs. Sieh auch im Spam-Ordner nach.",
  nieuwWachtwoordTitel: "Neues Passwort festlegen",
  nieuwWachtwoord: "Neues Passwort",
  wachtwoordGewijzigd: "Dein Passwort wurde geändert.",

  accountTitel: "Mein Konto",
  rol: "Rolle",
  rollen: {
    lid: "Mitglied",
    redacteur: "Redakteur",
    moderator: "Moderator",
    beheerder: "Administrator",
  },
  tweeFactorStatus: "Zwei-Faktor-Authentifizierung",
  aan: "Aktiv",
  herstelcodesResterend: "Unbenutzte Wiederherstellungscodes",
  nieuweHerstelcodes: "Neue Wiederherstellungscodes erstellen",
  nieuweHerstelcodesUitleg: "Die alten Codes funktionieren danach nicht mehr.",
  wachtwoordWijzigen: "Passwort ändern",
  naarForum: "Zum Forum",
  naarModeratie: "Zur Moderation",
  naarBeheer: "Zum Verwaltungsbereich",

  fouten: {
    algemeen: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    geenDatabase:
      "Die Kontofunktionen sind noch nicht bereit: In der Datenbank fehlen die Tabellen aus 004_accounts_en_forum.sql.",
    gebruikersnaam: "Wähle einen Benutzernamen mit 3 bis 30 Zeichen: Buchstaben, Ziffern, . - _",
    gebruikersnaamBezet: "Dieser Benutzername ist bereits vergeben.",
    email: "Gib eine gültige E-Mail-Adresse ein.",
    wachtwoordKort: "Das Passwort muss zwischen 10 und 72 Zeichen lang sein.",
    wachtwoordVerschil: "Die beiden Passwörter stimmen nicht überein.",
    wachtwoordZwak:
      "Dieses Passwort ist zu schwach oder taucht in geleakten Listen auf. Wähle ein anderes.",
    wachtwoordZelfde: "Das neue Passwort muss sich vom alten unterscheiden.",
    akkoord: "Bitte akzeptiere die Forenregeln, um ein Konto zu erstellen.",
    inloggen: "E-Mail-Adresse oder Passwort ist falsch.",
    nietBevestigd:
      "Deine E-Mail-Adresse ist noch nicht bestätigt. Klicke auf den Link in der E-Mail, die wir dir geschickt haben.",
    teVaak: "Zu viele Versuche. Warte ein paar Minuten und versuche es erneut.",
    botcontrole: "Die Prüfung gegen Bots ist fehlgeschlagen. Bitte versuche es erneut.",
    code: "Dieser Code ist falsch oder abgelaufen. Versuche den nächsten Code der App.",
    codeVorm: "Gib die 6 Ziffern aus der App ein.",
    herstelcode: "Dieser Wiederherstellungscode ist falsch oder wurde bereits verwendet.",
    geenSleutel:
      "Das ist gerade nicht möglich: Der geheime Supabase-Serverschlüssel fehlt in den Vercel-Einstellungen.",
    nietIngelogd: "Du bist nicht (mehr) angemeldet.",
    opnieuwInloggen: "Melde dich sicherheitshalber erneut an und versuche es dann noch einmal.",
  },

  forum: {
    titel: "Forum",
    intro:
      "Stelle deine Frage zu Home Assistant oder hilf anderen weiter. Lesen kann jeder; zum Schreiben brauchst du ein Konto mit Zwei-Faktor-Authentifizierung.",
    nieuweVraag: "Neue Frage stellen",
    onderwerpen: "Themen",
    recent: "Neueste Diskussionen",
    geenDraden: "Hier gibt es noch keine Diskussionen. Stelle die erste Frage!",
    reacties: (n: number) => (n === 1 ? "1 Antwort" : `${n} Antworten`),
    door: "von",
    laatsteActiviteit: "Letzte Aktivität",
    gesloten: "Geschlossen",
    regelsLink: "Forenregeln",
    nogNietBeschikbaar:
      "Das Forum ist noch nicht bereit: In der Datenbank fehlen die Tabellen aus 004_accounts_en_forum.sql.",

    origineel: "Original",
    automatischVertaald: "Automatisch übersetzt aus dem",
    nogNietVertaald: "noch nicht übersetzt",
    origineelTonen: "Original anzeigen",
    reageren: "Antworten",
    jouwReactie: "Deine Antwort",
    plaatsen: "Veröffentlichen",
    inloggenOmTeReageren: "Melde dich an, um zu antworten",
    draadGesloten: "Diese Diskussion ist geschlossen; Antworten sind nicht mehr möglich.",
    melden: "Melden",
    meldReden: "Warum meldest du diesen Beitrag?",
    meldVersturen: "Meldung senden",
    gemeld: "Danke. Ein Moderator sieht sich deine Meldung an.",
    verwijderen: "Löschen",
    verwijderenBevestig: "Diesen Beitrag löschen",
    wachtOpGoedkeuring:
      "Dieser Beitrag wartet auf die Freigabe durch einen Moderator und ist für andere noch nicht sichtbar.",
    verborgen: "Von einem Moderator ausgeblendet",
    codeUitleg:
      "Tipp: Setze Code zwischen ``` in eine eigene Zeile; die Formatierung bleibt erhalten und der Code wird nie übersetzt.",
    bewerkt: "bearbeitet",

    nieuwTitel: "Neue Frage stellen",
    onderwerp: "Thema",
    titelVeld: "Titel",
    titelUitleg: "Fasse deine Frage in einem Satz zusammen (5 bis 150 Zeichen).",
    tekst: "Deine Frage",
    taalVeld: "Sprache deines Beitrags",
    taalUitleg: "Andere Besucher lesen deinen Beitrag in ihrer eigenen Sprache.",

    moderatieTitel: "Moderation",
    openMeldingen: "Offene Meldungen",
    geenMeldingen: "Es gibt keine offenen Meldungen.",
    wachtend: "Wartet auf Freigabe",
    geenWachtend: "Es warten keine Beiträge.",
    logboek: "Protokoll",
    blokkades: "Aktive Sperren",
    geenBlokkades: "Niemand ist gesperrt.",
    gemeldDoor: "gemeldet von",
    tonen: "Freigeben / anzeigen",
    verbergen: "Ausblenden",
    afwijzen: "Meldung ablehnen",
    blokkeer7: "Autor 7 Tage sperren",
    blokkeerPermanent: "Autor dauerhaft sperren",
    deblokkeren: "Sperre aufheben",
    tot: "bis",
    permanent: "dauerhaft",
    sluiten: "Diskussion schließen",
    openen: "Diskussion wieder öffnen",
    geenToegang: "Diese Seite ist nur für Moderatoren und Administratoren.",
    status: "Status",
  },

  forumFouten: {
    NIET_INGELOGD: "Du bist nicht angemeldet.",
    GEEN_2FA: "Bestätige zuerst deine Anmeldung mit der Authenticator-App.",
    GEEN_PROFIEL: "Dein Konto hat noch kein Profil. Melde dich erneut an.",
    GEBLOKKEERD: "Dein Konto ist (vorübergehend) für das Forum gesperrt.",
    LIMIET_BERICHTEN:
      "Du hast in kurzer Zeit viele Beiträge veröffentlicht. Warte einen Moment und versuche es erneut.",
    LIMIET_DRADEN: "Du kannst höchstens 3 neue Fragen pro Stunde stellen.",
    LIMIET_MELDINGEN: "Du hast heute schon viele Meldungen gesendet.",
    DRAAD_ONBEKEND: "Diese Diskussion existiert nicht (mehr).",
    DRAAD_GESLOTEN: "Diese Diskussion ist geschlossen.",
    BERICHT_ONBEKEND: "Dieser Beitrag existiert nicht (mehr).",
    NIET_TOEGESTAAN: "Das ist nicht erlaubt.",
    GEEN_MODERATOR: "Nur Moderatoren können das tun.",
    TITEL: "Der Titel muss 5 bis 150 Zeichen lang sein.",
    TEKST: "Dein Beitrag muss 2 bis 20.000 Zeichen lang sein.",
    REDEN: "Gib einen Grund mit 3 bis 1000 Zeichen an.",
    ONDERWERP: "Wähle ein Thema.",
  },
};

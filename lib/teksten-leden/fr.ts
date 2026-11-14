// Vaste teksten voor accounts en forum: Frans.
import type { Teksten } from "../teksten-leden";

export const fr: Teksten = {
  inloggen: "Se connecter",
  registreren: "Créer un compte",
  mijnAccount: "Mon compte",
  uitloggen: "Se déconnecter",

  laden: "Chargement…",
  bezig: "Veuillez patienter…",
  opslaan: "Enregistrer",
  doorgaan: "Continuer",
  terug: "Retour",
  email: "Adresse e-mail",
  wachtwoord: "Mot de passe",
  wachtwoordHerhalen: "Répéter le mot de passe",
  gebruikersnaam: "Nom d'utilisateur",
  gebruikersnaamUitleg:
    "3 à 30 caractères : lettres, chiffres, point, tiret et tiret bas. Ce nom est public.",
  wachtwoordUitleg: "Au moins 10 caractères. Une phrase de quelques mots fonctionne bien.",
  verplicht2faUitleg:
    "La vérification en deux étapes est obligatoire sur ce site. Après avoir confirmé votre adresse e-mail, vous associez une application d'authentification, comme Google Authenticator, Microsoft Authenticator ou 1Password.",

  registrerenTitel: "Créer un compte",
  akkoordMet: "J'accepte les",
  forumregels: "règles du forum et conditions d'utilisation",
  alAccount: "Vous avez déjà un compte ?",
  controleerEmail:
    "Presque terminé. Nous vous avons envoyé un e-mail. Cliquez sur le lien dans cet e-mail pour confirmer votre adresse ; vous configurerez ensuite l'application d'authentification.",

  inloggenTitel: "Se connecter",
  nogGeenAccount: "Pas encore de compte ?",
  wachtwoordVergetenLink: "Mot de passe oublié ?",
  meldingen: {
    "link-ongeldig":
      "Ce lien a expiré ou a déjà été utilisé. Connectez-vous ou demandez un nouveau lien.",
    "2fa-hersteld":
      "Votre code de récupération a été utilisé et votre application d'authentification a été dissociée. Reconnectez-vous et associez immédiatement une nouvelle application.",
    uitgelogd: "Vous êtes déconnecté.",
  },

  tweeFactorTitel: "Vérification en deux étapes",
  tweeFactorUitleg: "Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.",
  code: "Code",
  bevestigen: "Confirmer",
  geenToegangApp: "Pas d'accès à votre application ? Utilisez un code de récupération",

  instellenTitel: "Associer une application d'authentification",
  instellenStap1:
    "Étape 1. Installez une application d'authentification sur votre téléphone si vous n'en avez pas encore.",
  instellenStap2: "Étape 2. Scannez ce code QR avec l'application.",
  instellenStart: "Afficher le code QR",
  instellenHandmatig: "Impossible de scanner ? Saisissez cette clé manuellement :",
  instellenStap3: "Étape 3. Saisissez le code à 6 chiffres affiché par l'application.",
  qrAlt: "Code QR pour l'application d'authentification",

  herstelcodesTitel: "Vos codes de récupération",
  herstelcodesUitleg:
    "Conservez ces codes en lieu sûr, par exemple dans votre gestionnaire de mots de passe ou sur papier. Un code vous permet de vous connecter si vous perdez votre téléphone. Chaque code ne fonctionne qu'une fois. Vous ne les verrez qu'une seule fois.",
  herstelcodesBewaard: "J'ai enregistré les codes",
  herstelcodesKopieren: "Copier",
  herstelcodesGekopieerd: "Copié",
  herstelcodesNietBeschikbaar:
    "La 2FA est activée, mais les codes de récupération n'ont pas pu être créés : la clé secrète du serveur est manquante. Créez-les plus tard dans Mon compte.",
  herstelcodeTitel: "Se connecter avec un code de récupération",
  herstelcodeUitleg:
    "Saisissez l'un de vos codes de récupération. Votre application d'authentification sera ensuite dissociée et vous vous reconnecterez pour en associer une nouvelle.",
  herstelcode: "Code de récupération",
  herstelcodeGebruiken: "Utiliser le code de récupération",

  wachtwoordVergetenTitel: "Mot de passe oublié",
  wachtwoordVergetenUitleg:
    "Saisissez votre adresse e-mail. Si elle correspond à un compte, vous recevrez un e-mail avec un lien pour définir un nouveau mot de passe.",
  stuurLink: "Envoyer le lien",
  linkVerstuurd:
    "Si cette adresse correspond à un compte, un e-mail est en route. Vérifiez aussi votre dossier de courrier indésirable.",
  nieuwWachtwoordTitel: "Définir un nouveau mot de passe",
  nieuwWachtwoord: "Nouveau mot de passe",
  wachtwoordGewijzigd: "Votre mot de passe a été modifié.",

  accountTitel: "Mon compte",
  rol: "Rôle",
  rollen: {
    lid: "Membre",
    redacteur: "Rédacteur",
    moderator: "Modérateur",
    beheerder: "Administrateur",
  },
  tweeFactorStatus: "Vérification en deux étapes",
  aan: "Activée",
  herstelcodesResterend: "Codes de récupération inutilisés",
  nieuweHerstelcodes: "Créer de nouveaux codes de récupération",
  nieuweHerstelcodesUitleg: "Les anciens codes ne fonctionneront plus.",
  wachtwoordWijzigen: "Modifier le mot de passe",
  naarForum: "Aller au forum",
  naarModeratie: "Aller à la modération",
  naarBeheer: "Aller au panneau d'administration",

  fouten: {
    algemeen: "Une erreur s'est produite. Veuillez réessayer.",
    geenDatabase:
      "Les fonctions de compte ne sont pas encore prêtes : il manque à la base de données les tables de 004_accounts_en_forum.sql.",
    gebruikersnaam: "Choisissez un nom d'utilisateur de 3 à 30 caractères : lettres, chiffres, . - _",
    gebruikersnaamBezet: "Ce nom d'utilisateur est déjà pris.",
    email: "Saisissez une adresse e-mail valide.",
    wachtwoordKort: "Le mot de passe doit comporter entre 10 et 72 caractères.",
    wachtwoordVerschil: "Les deux mots de passe ne correspondent pas.",
    wachtwoordZwak:
      "Ce mot de passe est trop faible ou figure dans des listes de fuites. Choisissez-en un autre.",
    wachtwoordZelfde: "Le nouveau mot de passe doit être différent de l'ancien.",
    akkoord: "Veuillez accepter les règles du forum pour créer un compte.",
    inloggen: "Adresse e-mail ou mot de passe incorrect.",
    nietBevestigd:
      "Votre adresse e-mail n'est pas encore confirmée. Cliquez sur le lien dans l'e-mail que nous vous avons envoyé.",
    teVaak: "Trop de tentatives. Attendez quelques minutes et réessayez.",
    botcontrole: "La vérification anti-robot a échoué. Veuillez réessayer.",
    code: "Ce code est incorrect ou a expiré. Essayez le code suivant de l'application.",
    codeVorm: "Saisissez les 6 chiffres de l'application.",
    herstelcode: "Ce code de récupération est incorrect ou a déjà été utilisé.",
    geenSleutel:
      "Impossible pour le moment : la clé secrète du serveur Supabase est absente des paramètres de Vercel.",
    nietIngelogd: "Vous n'êtes pas (ou plus) connecté.",
    opnieuwInloggen: "Par sécurité, reconnectez-vous puis réessayez.",
  },

  forum: {
    titel: "Forum",
    intro:
      "Posez votre question sur Home Assistant ou aidez quelqu'un d'autre. Tout le monde peut lire ; pour publier, il faut un compte avec la vérification en deux étapes.",
    nieuweVraag: "Poser une nouvelle question",
    onderwerpen: "Sujets",
    recent: "Discussions récentes",
    geenDraden: "Aucune discussion ici pour l'instant. Posez la première question !",
    reacties: (n: number) => (n <= 1 ? `${n} réponse` : `${n} réponses`),
    door: "par",
    laatsteActiviteit: "Dernière activité",
    gesloten: "Fermée",
    regelsLink: "Règles du forum",
    nogNietBeschikbaar:
      "Le forum n'est pas encore prêt : il manque à la base de données les tables de 004_accounts_en_forum.sql.",

    origineel: "Original",
    automatischVertaald: "Traduit automatiquement",
    nogNietVertaald: "pas encore traduit",
    origineelTonen: "Voir l'original",
    reageren: "Répondre",
    jouwReactie: "Votre réponse",
    plaatsen: "Publier",
    inloggenOmTeReageren: "Connectez-vous pour répondre",
    draadGesloten: "Cette discussion est fermée ; il n'est plus possible de répondre.",
    melden: "Signaler",
    meldReden: "Pourquoi signalez-vous ce message ?",
    meldVersturen: "Envoyer le signalement",
    gemeld: "Merci. Un modérateur examinera votre signalement.",
    verwijderen: "Supprimer",
    verwijderenBevestig: "Supprimer ce message",
    wachtOpGoedkeuring:
      "Ce message attend l'approbation d'un modérateur et n'est pas encore visible par les autres.",
    verborgen: "Masqué par un modérateur",
    codeUitleg:
      "Astuce : placez le code entre ``` sur une ligne à part ; la mise en forme est conservée et le code n'est jamais traduit.",
    bewerkt: "modifié",

    nieuwTitel: "Poser une nouvelle question",
    onderwerp: "Sujet",
    titelVeld: "Titre",
    titelUitleg: "Résumez votre question en une phrase (5 à 150 caractères).",
    tekst: "Votre question",
    taalVeld: "Langue de votre message",
    taalUitleg: "Les autres visiteurs lisent votre message dans leur propre langue.",

    moderatieTitel: "Modération",
    openMeldingen: "Signalements ouverts",
    geenMeldingen: "Aucun signalement ouvert.",
    wachtend: "En attente d'approbation",
    geenWachtend: "Aucun message en attente.",
    logboek: "Journal",
    blokkades: "Blocages actifs",
    geenBlokkades: "Personne n'est bloqué.",
    gemeldDoor: "signalé par",
    tonen: "Approuver / afficher",
    verbergen: "Masquer",
    afwijzen: "Rejeter le signalement",
    blokkeer7: "Bloquer l'auteur 7 jours",
    blokkeerPermanent: "Bloquer l'auteur définitivement",
    deblokkeren: "Lever le blocage",
    tot: "jusqu'au",
    permanent: "définitif",
    sluiten: "Fermer la discussion",
    openen: "Rouvrir la discussion",
    geenToegang: "Cette page est réservée aux modérateurs et aux administrateurs.",
    status: "Statut",
  },

  forumFouten: {
    NIET_INGELOGD: "Vous n'êtes pas connecté.",
    GEEN_2FA: "Confirmez d'abord votre connexion avec l'application d'authentification.",
    GEEN_PROFIEL: "Votre compte n'a pas encore de profil. Reconnectez-vous.",
    GEBLOKKEERD: "Votre compte est (temporairement) bloqué sur le forum.",
    LIMIET_BERICHTEN:
      "Vous avez publié beaucoup de messages en peu de temps. Patientez un instant et réessayez.",
    LIMIET_DRADEN: "Vous pouvez poser au maximum 3 nouvelles questions par heure.",
    LIMIET_MELDINGEN: "Vous avez déjà envoyé beaucoup de signalements aujourd'hui.",
    DRAAD_ONBEKEND: "Cette discussion n'existe pas (ou plus).",
    DRAAD_GESLOTEN: "Cette discussion est fermée.",
    BERICHT_ONBEKEND: "Ce message n'existe pas (ou plus).",
    NIET_TOEGESTAAN: "Ce n'est pas autorisé.",
    GEEN_MODERATOR: "Seuls les modérateurs peuvent faire cela.",
    TITEL: "Le titre doit comporter 5 à 150 caractères.",
    TEKST: "Votre message doit comporter 2 à 20 000 caractères.",
    REDEN: "Indiquez une raison de 3 à 1000 caractères.",
    ONDERWERP: "Choisissez un sujet.",
  },
};

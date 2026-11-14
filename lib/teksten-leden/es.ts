// Vaste teksten voor accounts en forum: Spaans.
import type { Teksten } from "../teksten-leden";

export const es: Teksten = {
  inloggen: "Iniciar sesión",
  registreren: "Crear cuenta",
  mijnAccount: "Mi cuenta",
  uitloggen: "Cerrar sesión",

  laden: "Cargando…",
  bezig: "Un momento…",
  opslaan: "Guardar",
  doorgaan: "Continuar",
  terug: "Volver",
  email: "Correo electrónico",
  wachtwoord: "Contraseña",
  wachtwoordHerhalen: "Repetir contraseña",
  gebruikersnaam: "Nombre de usuario",
  gebruikersnaamUitleg:
    "De 3 a 30 caracteres: letras, cifras, punto, guion y guion bajo. Este nombre es público.",
  wachtwoordUitleg: "Al menos 10 caracteres. Una frase de unas pocas palabras funciona bien.",
  verplicht2faUitleg:
    "En este sitio la verificación en dos pasos es obligatoria. Después de confirmar tu correo electrónico, vinculas una aplicación de autenticación, como Google Authenticator, Microsoft Authenticator o 1Password.",

  registrerenTitel: "Crear cuenta",
  akkoordMet: "Acepto las",
  forumregels: "normas del foro y condiciones de uso",
  alAccount: "¿Ya tienes una cuenta?",
  controleerEmail:
    "Casi listo. Te hemos enviado un correo electrónico. Haz clic en el enlace de ese correo para confirmar tu dirección; después configurarás la aplicación de autenticación.",

  inloggenTitel: "Iniciar sesión",
  nogGeenAccount: "¿Todavía no tienes cuenta?",
  wachtwoordVergetenLink: "¿Has olvidado tu contraseña?",
  meldingen: {
    "link-ongeldig":
      "Este enlace ha caducado o ya se ha usado. Inicia sesión o solicita un enlace nuevo.",
    "2fa-hersteld":
      "Se ha usado tu código de recuperación y se ha desvinculado tu aplicación de autenticación. Vuelve a iniciar sesión y vincula una aplicación nueva enseguida.",
    uitgelogd: "Has cerrado sesión.",
  },

  tweeFactorTitel: "Verificación en dos pasos",
  tweeFactorUitleg: "Abre tu aplicación de autenticación e introduce el código de 6 cifras.",
  code: "Código",
  bevestigen: "Confirmar",
  geenToegangApp: "¿No tienes acceso a tu aplicación? Usa un código de recuperación",

  instellenTitel: "Vincular una aplicación de autenticación",
  instellenStap1:
    "Paso 1. Instala una aplicación de autenticación en tu teléfono si aún no tienes ninguna.",
  instellenStap2: "Paso 2. Escanea este código QR con la aplicación.",
  instellenStart: "Mostrar código QR",
  instellenHandmatig: "¿No puedes escanear? Introduce esta clave manualmente:",
  instellenStap3: "Paso 3. Introduce el código de 6 cifras que muestra ahora la aplicación.",
  qrAlt: "Código QR para la aplicación de autenticación",

  herstelcodesTitel: "Tus códigos de recuperación",
  herstelcodesUitleg:
    "Guarda estos códigos en un lugar seguro, por ejemplo en tu gestor de contraseñas o en papel. Con un código puedes entrar si pierdes el teléfono. Cada código funciona una sola vez. Solo los verás una vez.",
  herstelcodesBewaard: "He guardado los códigos",
  herstelcodesKopieren: "Copiar",
  herstelcodesGekopieerd: "Copiado",
  herstelcodesNietBeschikbaar:
    "La verificación en dos pasos está activada, pero no se han podido crear códigos de recuperación porque falta la clave secreta del servidor. Créalos más tarde en Mi cuenta.",
  herstelcodeTitel: "Iniciar sesión con un código de recuperación",
  herstelcodeUitleg:
    "Introduce uno de tus códigos de recuperación. Después se desvinculará tu aplicación de autenticación y volverás a iniciar sesión para vincular una nueva.",
  herstelcode: "Código de recuperación",
  herstelcodeGebruiken: "Usar código de recuperación",

  wachtwoordVergetenTitel: "Contraseña olvidada",
  wachtwoordVergetenUitleg:
    "Introduce tu correo electrónico. Si corresponde a una cuenta, recibirás un correo con un enlace para establecer una contraseña nueva.",
  stuurLink: "Enviar enlace",
  linkVerstuurd:
    "Si esta dirección corresponde a una cuenta, ya hay un correo en camino. Revisa también la carpeta de spam.",
  nieuwWachtwoordTitel: "Establecer una contraseña nueva",
  nieuwWachtwoord: "Contraseña nueva",
  wachtwoordGewijzigd: "Tu contraseña se ha cambiado.",

  accountTitel: "Mi cuenta",
  rol: "Función",
  rollen: {
    lid: "Miembro",
    redacteur: "Editor",
    moderator: "Moderador",
    beheerder: "Administrador",
  },
  tweeFactorStatus: "Verificación en dos pasos",
  aan: "Activada",
  herstelcodesResterend: "Códigos de recuperación sin usar",
  nieuweHerstelcodes: "Crear códigos de recuperación nuevos",
  nieuweHerstelcodesUitleg: "Los códigos antiguos dejarán de funcionar.",
  wachtwoordWijzigen: "Cambiar contraseña",
  naarForum: "Ir al foro",
  naarModeratie: "Ir a la moderación",
  naarBeheer: "Ir al panel de administración",

  fouten: {
    algemeen: "Algo ha salido mal. Inténtalo de nuevo.",
    geenDatabase:
      "Las funciones de cuenta todavía no están listas: a la base de datos le faltan las tablas de 004_accounts_en_forum.sql.",
    gebruikersnaam: "Elige un nombre de usuario de 3 a 30 caracteres: letras, cifras, . - _",
    gebruikersnaamBezet: "Este nombre de usuario ya está en uso.",
    email: "Introduce un correo electrónico válido.",
    wachtwoordKort: "La contraseña debe tener entre 10 y 72 caracteres.",
    wachtwoordVerschil: "Las dos contraseñas no coinciden.",
    wachtwoordZwak:
      "Esta contraseña es demasiado débil o aparece en listas filtradas. Elige otra.",
    wachtwoordZelfde: "La contraseña nueva debe ser distinta de la anterior.",
    akkoord: "Acepta las normas del foro para crear una cuenta.",
    inloggen: "El correo electrónico o la contraseña no son correctos.",
    nietBevestigd:
      "Tu correo electrónico aún no está confirmado. Haz clic en el enlace del correo que te enviamos.",
    teVaak: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    botcontrole: "La comprobación contra robots ha fallado. Inténtalo de nuevo.",
    code: "Este código no es correcto o ha caducado. Prueba el siguiente código de la aplicación.",
    codeVorm: "Introduce las 6 cifras de la aplicación.",
    herstelcode: "Este código de recuperación no es correcto o ya se ha usado.",
    geenSleutel:
      "Ahora no es posible: falta la clave secreta del servidor de Supabase en la configuración de Vercel.",
    nietIngelogd: "No has iniciado sesión (o la sesión ha caducado).",
    opnieuwInloggen: "Por seguridad, vuelve a iniciar sesión e inténtalo otra vez.",
  },

  forum: {
    titel: "Foro",
    intro:
      "Haz tu pregunta sobre Home Assistant o ayuda a otra persona. Cualquiera puede leer; para publicar necesitas una cuenta con verificación en dos pasos.",
    nieuweVraag: "Hacer una pregunta nueva",
    onderwerpen: "Temas",
    recent: "Debates recientes",
    geenDraden: "Todavía no hay debates aquí. ¡Haz la primera pregunta!",
    reacties: (n: number) => (n === 1 ? "1 respuesta" : `${n} respuestas`),
    door: "por",
    laatsteActiviteit: "Última actividad",
    gesloten: "Cerrado",
    regelsLink: "Normas del foro",
    nogNietBeschikbaar:
      "El foro todavía no está listo: a la base de datos le faltan las tablas de 004_accounts_en_forum.sql.",

    origineel: "Original",
    automatischVertaald: "Traducido automáticamente",
    nogNietVertaald: "aún sin traducir",
    origineelTonen: "Ver el original",
    reageren: "Responder",
    jouwReactie: "Tu respuesta",
    plaatsen: "Publicar",
    inloggenOmTeReageren: "Inicia sesión para responder",
    draadGesloten: "Este debate está cerrado; ya no se puede responder.",
    melden: "Denunciar",
    meldReden: "¿Por qué denuncias este mensaje?",
    meldVersturen: "Enviar denuncia",
    gemeld: "Gracias. Un moderador revisará tu denuncia.",
    verwijderen: "Eliminar",
    verwijderenBevestig: "Eliminar este mensaje",
    wachtOpGoedkeuring:
      "Este mensaje está pendiente de aprobación por un moderador y todavía no es visible para los demás.",
    verborgen: "Ocultado por un moderador",
    codeUitleg:
      "Consejo: pon el código entre ``` en una línea aparte; el formato se conserva y el código nunca se traduce.",
    bewerkt: "editado",

    nieuwTitel: "Hacer una pregunta nueva",
    onderwerp: "Tema",
    titelVeld: "Título",
    titelUitleg: "Resume tu pregunta en una frase (de 5 a 150 caracteres).",
    tekst: "Tu pregunta",
    taalVeld: "Idioma de tu mensaje",
    taalUitleg: "Los demás visitantes leen tu mensaje en su propio idioma.",

    moderatieTitel: "Moderación",
    openMeldingen: "Denuncias abiertas",
    geenMeldingen: "No hay denuncias abiertas.",
    wachtend: "Pendiente de aprobación",
    geenWachtend: "No hay mensajes pendientes.",
    logboek: "Registro",
    blokkades: "Bloqueos activos",
    geenBlokkades: "No hay nadie bloqueado.",
    gemeldDoor: "denunciado por",
    tonen: "Aprobar / mostrar",
    verbergen: "Ocultar",
    afwijzen: "Rechazar denuncia",
    blokkeer7: "Bloquear al autor 7 días",
    blokkeerPermanent: "Bloquear al autor para siempre",
    deblokkeren: "Levantar el bloqueo",
    tot: "hasta",
    permanent: "permanente",
    sluiten: "Cerrar debate",
    openen: "Reabrir debate",
    geenToegang: "Esta página es solo para moderadores y administradores.",
    status: "Estado",
    vertalenNaar: "Traducir también automáticamente a",
    plaatsenEnVertalen: (n: number) => (n === 1 ? "Publicar y traducir a 1 idioma" : `Publicar y traducir a ${n} idiomas`),
    alleenPlaatsenIn: (taal: string) => `Publicar solo en ${taal}`,
    vertaalknop: "Traducir a otros idiomas",
    vertaalStarten: (n: number) => (n === 1 ? "Traducir a 1 idioma" : `Traducir a ${n} idiomas`),
    vertaalGestart: "La traducción está en la cola y aparecerá automáticamente cuando esté lista.",
    vertaalStatus: (wacht: number, mislukt: number) =>
      [wacht ? `${wacht} traducción(es) en la cola` : "", mislukt ? `${mislukt} traducción(es) fallida(s): vuelve a intentarlo con el botón de traducir` : ""].filter(Boolean).join(" · "),
    bewerken: "Editar",
    bewerkenOpslaan: "Guardar cambios",
    bewerktMelding: "Tu mensaje se ha modificado. Las traducciones siguen siendo de la versión anterior: actualízalas con «Traducir a otros idiomas».",
    vertalingVerouderd: "Esta traducción corresponde a una versión anterior del mensaje.",
  },

  forumFouten: {
    NIET_INGELOGD: "No has iniciado sesión.",
    GEEN_2FA: "Confirma primero tu inicio de sesión con la aplicación de autenticación.",
    GEEN_PROFIEL: "Tu cuenta todavía no tiene perfil. Vuelve a iniciar sesión.",
    GEBLOKKEERD: "Tu cuenta está bloqueada (temporalmente) en el foro.",
    LIMIET_BERICHTEN:
      "Has publicado muchos mensajes en poco tiempo. Espera un momento y vuelve a intentarlo.",
    LIMIET_DRADEN: "Puedes hacer como máximo 3 preguntas nuevas por hora.",
    LIMIET_MELDINGEN: "Hoy ya has enviado muchas denuncias.",
    DRAAD_ONBEKEND: "Este debate no existe (o ya no existe).",
    DRAAD_GESLOTEN: "Este debate está cerrado.",
    BERICHT_ONBEKEND: "Este mensaje no existe (o ya no existe).",
    NIET_TOEGESTAAN: "Eso no está permitido.",
    GEEN_MODERATOR: "Solo los moderadores pueden hacer esto.",
    TITEL: "El título debe tener de 5 a 150 caracteres.",
    TEKST: "Tu mensaje debe tener de 2 a 20.000 caracteres.",
    REDEN: "Indica un motivo de 3 a 1000 caracteres.",
    ONDERWERP: "Elige un tema.",
  },
};

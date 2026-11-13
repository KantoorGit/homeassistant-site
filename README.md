# homeassistant-site

Website over Home Assistant. Dit is het eerste skelet: de voorpagina in de
opbouw van nos.nl, de categoriebalk, twee talen en een test van de koppeling
met de database.

## Onderdelen

- **Hosting:** Vercel, publiceert automatisch bij elke wijziging in `main`.
  Andere branches krijgen een eigen testadres (Preview).
- **Database, accounts en opslag:** Supabase, gekoppeld via Vercel.
- **Techniek:** Next.js (App Router) met TypeScript.

## Waar staat wat

| Map of bestand | Inhoud |
|---|---|
| `lib/site.ts` | Naam van de site, talen, categorieën en vaste teksten |
| `lib/artikelen.ts` | Artikelen ophalen uit Supabase |
| `lib/voorbeeldartikelen.json` | Voorbeeldartikelen, getoond zolang de database leeg is |
| `lib/supabase.ts` | Verbinding met Supabase |
| `app/[lang]/` | De pagina's, per taal (`/nl/...`, `/en/...`) |
| `app/globals.css` | Huisstijl: kleuren en lettertypen |
| `components/` | Categoriebalk, taalkiezer en artikelkaart |
| `supabase/` | SQL-bestanden voor de database |
| `app/[lang]/account/` | Registreren, inloggen, verplichte 2FA, herstelcodes, wachtwoord |
| `app/[lang]/forum/` | Forum: overzicht, onderwerpen, discussies, nieuwe vraag, moderatie, regels |
| `app/auth/bevestigen/` | Ontvangt de links uit de e-mails van Supabase |
| `lib/sessie.ts` | Wie is ingelogd, en de controle "ingelogd met 2FA" |
| `lib/herstelcodes.ts` | Herstelcodes voor 2FA (alleen op de server) |
| `proxy.ts` | Vernieuwt de inlogsessie bij elk verzoek |

## Koppeling met de database testen

1. Open het Supabase-dashboard, ga naar de SQL Editor en voer de bestanden
   in `supabase/` uit, in volgorde van nummer.
2. Open op de gepubliceerde site `/nl/verbindingstest`.
3. Vier keer "Goed" betekent dat de site de database en de artikelen leest.

## Accounts en forum

Beveiliging in het kort:

- Inloggen met e-mailadres en wachtwoord, daarna altijd een code uit een
  authenticator-app (2FA is verplicht en wordt na de eerste bevestiging
  ingesteld). Bij het instellen krijgt het lid tien herstelcodes.
- Schrijven in het forum kan alleen via databasefuncties die controleren dat
  de schrijver met 2FA is ingelogd, niet geblokkeerd is en binnen de limieten
  blijft (5 berichten per 10 minuten, 50 per dag, 3 nieuwe vragen per uur).
- Verdachte berichten (filterwoorden, veel links, link van een nieuw account)
  wachten op goedkeuring. Melden, moderatie en een logboek zitten erin.
- Berichten worden als platte tekst getoond; code tussen ``` blijft code.
- Optioneel: Cloudflare Turnstile tegen robots bij registreren, inloggen en
  wachtwoord vergeten (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).

Eenmalig instellen in Supabase:

1. Voer `supabase/003_beheer.sql` en daarna `supabase/004_accounts_en_forum.sql`
   uit in de SQL Editor.
2. Authentication → URL Configuration: Site URL
   `https://www.winstonyip.com`; bij Redirect URLs
   `https://www.winstonyip.com/**`, `https://*-ha-dc33.vercel.app/**` en
   `http://localhost:3000/**`.
3. Authentication → Sign In / Providers → Email: "Confirm email" aan.
4. Kies je forumnaam en maak jezelf beheerder (zie onderaan `004`).

Accounts van het beheerpaneel (`/beheer`) en van het forum zijn dezelfde
Supabase-accounts. Herstelcodes maak je via Mijn account (`/nl/account`).

## Zoekmachines

Zolang de site in opbouw is, houdt hij zoekmachines buiten. De schakelaar
staat in `lib/site.ts` (`zoekmachinesToelaten`); zet die op `true` bij
livegang.

## Lokaal draaien

```bash
npm install
vercel env pull .env.local   # haalt de variabelen van Vercel op
npm run dev
```

Sleutels en wachtwoorden staan nooit in deze repository, alleen in de
instellingen van Vercel.

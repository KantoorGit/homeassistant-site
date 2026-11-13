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
| `lib/voorbeeldartikelen.ts` | Voorbeeldartikelen, tot de database ze levert |
| `lib/supabase.ts` | Verbinding met Supabase |
| `app/[lang]/` | De pagina's, per taal (`/nl/...`, `/en/...`) |
| `app/globals.css` | Huisstijl: kleuren en lettertypen |
| `components/` | Categoriebalk, taalkiezer en artikelkaart |
| `supabase/` | SQL-bestanden voor de database |

## Koppeling met de database testen

1. Open het Supabase-dashboard, ga naar de SQL Editor en voer
   `supabase/001_verbindingstest.sql` uit.
2. Open op de gepubliceerde site `/nl/verbindingstest`.
3. Drie keer "Goed" betekent dat de site de database kan lezen.

## Lokaal draaien

```bash
npm install
vercel env pull .env.local   # haalt de variabelen van Vercel op
npm run dev
```

Sleutels en wachtwoorden staan nooit in deze repository, alleen in de
instellingen van Vercel.

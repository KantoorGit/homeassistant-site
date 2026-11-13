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

## Koppeling met de database testen

1. Open het Supabase-dashboard, ga naar de SQL Editor en voer de bestanden
   in `supabase/` uit, in volgorde van nummer.
2. Open op de gepubliceerde site `/nl/verbindingstest`.
3. Vier keer "Goed" betekent dat de site de database en de artikelen leest.

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

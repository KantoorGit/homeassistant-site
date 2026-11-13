-- Artikelen en hun vertalingen.
-- Uitvoeren: Supabase-dashboard -> SQL Editor -> plakken -> Run.
-- Veilig om vaker uit te voeren: bestaande rijen blijven ongewijzigd.

-- Een artikel: de gegevens die voor alle talen gelijk zijn.
create table if not exists public.artikelen (
  id uuid primary key default gen_random_uuid(),
  categorie_id text not null,
  originele_taal text not null
    check (originele_taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  auteur text not null default 'Redactie',
  afbeelding_url text,
  status text not null default 'concept'
    check (status in ('concept', 'gepubliceerd')),
  gepubliceerd_op timestamptz,
  is_voorbeeld boolean not null default false,
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now()
);

-- De tekst van een artikel, één rij per taal (requirements W-TAAL-04 en -06).
-- 'automatisch_vertaald' stuurt de melding bij een vertaling (W-TAAL-08);
-- 'handmatig_gecorrigeerd' voorkomt dat een verbeterde vertaling wordt
-- overschreven (W-TAAL-07).
create table if not exists public.artikel_vertalingen (
  artikel_id uuid not null references public.artikelen (id) on delete cascade,
  taal text not null check (taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  slug text not null,
  kop text not null,
  intro text not null default '',
  tekst text not null default '',
  automatisch_vertaald boolean not null default false,
  handmatig_gecorrigeerd boolean not null default false,
  bijgewerkt timestamptz not null default now(),
  primary key (artikel_id, taal),
  unique (taal, slug)
);

create index if not exists artikelen_gepubliceerd_idx
  on public.artikelen (status, gepubliceerd_op desc);

-- Toegangsregels: bezoekers lezen alleen gepubliceerde artikelen.
-- Schrijven kan nog niemand; dat komt met het beheerpaneel.
alter table public.artikelen enable row level security;
alter table public.artikel_vertalingen enable row level security;

drop policy if exists "Gepubliceerde artikelen zijn leesbaar" on public.artikelen;
create policy "Gepubliceerde artikelen zijn leesbaar"
  on public.artikelen
  for select
  to anon, authenticated
  using (status = 'gepubliceerd' and gepubliceerd_op <= now());

drop policy if exists "Vertalingen van gepubliceerde artikelen zijn leesbaar"
  on public.artikel_vertalingen;
create policy "Vertalingen van gepubliceerde artikelen zijn leesbaar"
  on public.artikel_vertalingen
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.artikelen a
      where a.id = artikel_id
        and a.status = 'gepubliceerd'
        and a.gepubliceerd_op <= now()
    )
  );

grant select on public.artikelen to anon, authenticated;
grant select on public.artikel_vertalingen to anon, authenticated;

-- Voorbeeldartikelen. Later in één keer te verwijderen met:
--   delete from public.artikelen where is_voorbeeld;
insert into public.artikelen
  (id, categorie_id, originele_taal, auteur, status, gepubliceerd_op, is_voorbeeld)
values
  ('2e06bb84-971e-588c-a79f-5bc1a4a8eba8', 'training', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T09:40:00+01:00', true),
  ('9710297d-b6a9-5630-8b6e-bcbb75e10b37', 'claude-en-ai', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T09:12:00+01:00', true),
  ('b43f392e-3a4e-5181-93d4-d7ad89d36a86', 'dashboards', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T08:55:00+01:00', true),
  ('916f430f-a292-5bd8-bc59-8832cbff50d4', 'automatiseringen', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T08:30:00+01:00', true),
  ('bf3c003d-6adc-5c77-9a8e-8433e18be67e', 'hardware', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T08:02:00+01:00', true),
  ('fcc318f0-9291-5ed7-9cd4-9db1317e7ff7', 'integraties', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T07:45:00+01:00', true),
  ('14636774-65c8-54a6-be03-daa3548bdd1e', 'aan-de-slag', 'nl', 'Redactie', 'gepubliceerd', '2026-11-13T07:20:00+01:00', true)
on conflict (id) do nothing;

insert into public.artikel_vertalingen
  (artikel_id, taal, slug, kop, intro, tekst, automatisch_vertaald)
values
  ('2e06bb84-971e-588c-a79f-5bc1a4a8eba8', 'nl', 'home-assistant-installeren-op-bmax', 'Home Assistant installeren op een Bmax mini-pc, stap voor stap', 'Van uitpakken tot het eerste dashboard: wat je nodig hebt, welke stappen je volgt en hoe je controleert of het gelukt is.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('2e06bb84-971e-588c-a79f-5bc1a4a8eba8', 'en', 'installing-home-assistant-on-bmax', 'Installing Home Assistant on a Bmax mini PC, step by step', 'From unboxing to your first dashboard: what you need, which steps to follow and how to check that it worked.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('9710297d-b6a9-5630-8b6e-bcbb75e10b37', 'nl', 'claude-schrijft-je-automatisering', 'Zo laat je Claude een automatisering voor je schrijven', 'Beschrijf in gewone taal wat je wilt en laat Claude de YAML maken.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('9710297d-b6a9-5630-8b6e-bcbb75e10b37', 'en', 'claude-writes-your-automation', 'How to have Claude write an automation for you', 'Describe what you want in plain language and let Claude write the YAML.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('b43f392e-3a4e-5181-93d4-d7ad89d36a86', 'nl', 'eerste-dashboard-in-tien-minuten', 'Je eerste dashboard in tien minuten', 'Met drie kaarten heb je al een overzicht van je hele huis.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('b43f392e-3a4e-5181-93d4-d7ad89d36a86', 'en', 'first-dashboard-in-ten-minutes', 'Your first dashboard in ten minutes', 'Three cards are enough for an overview of your whole home.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('916f430f-a292-5bd8-bc59-8832cbff50d4', 'nl', 'lampen-aan-bij-zonsondergang', 'Lampen aan bij zonsondergang: de eenvoudigste automatisering', 'Een goede eerste oefening om te zien hoe triggers en acties werken.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('916f430f-a292-5bd8-bc59-8832cbff50d4', 'en', 'lights-on-at-sunset', 'Lights on at sunset: the simplest automation', 'A good first exercise to see how triggers and actions work.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('bf3c003d-6adc-5c77-9a8e-8433e18be67e', 'nl', 'zigbee-of-matter', 'Zigbee of Matter: wat kies je voor nieuwe apparaten?', 'De verschillen op een rij, met advies per situatie.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('bf3c003d-6adc-5c77-9a8e-8433e18be67e', 'en', 'zigbee-or-matter', 'Zigbee or Matter: what to pick for new devices?', 'The differences side by side, with advice per situation.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('fcc318f0-9291-5ed7-9cd4-9db1317e7ff7', 'nl', 'slimme-meter-koppelen-via-p1', 'De slimme meter koppelen via de P1-poort', 'Zie je stroom- en gasverbruik live in het energiedashboard.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('fcc318f0-9291-5ed7-9cd4-9db1317e7ff7', 'en', 'connecting-smart-meter-via-p1', 'Connecting your smart meter through the P1 port', 'See your electricity and gas usage live in the energy dashboard.', 'This is a sample article. The final text will follow once the editors have written the article.', true),
  ('14636774-65c8-54a6-be03-daa3548bdd1e', 'nl', 'wat-is-home-assistant', 'Wat is Home Assistant en wat heb je ervoor nodig?', 'Een korte uitleg voor wie nog nooit met domotica heeft gewerkt.', 'Dit is een voorbeeldartikel. De definitieve tekst volgt zodra de redactie het artikel heeft geschreven.', false),
  ('14636774-65c8-54a6-be03-daa3548bdd1e', 'en', 'what-is-home-assistant', 'What is Home Assistant and what do you need for it?', 'A short explanation for anyone new to home automation.', 'This is a sample article. The final text will follow once the editors have written the article.', true)
on conflict (artikel_id, taal) do nothing;

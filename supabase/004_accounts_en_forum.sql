-- Accounts voor bezoekers (gebruikersnaam, blokkades, herstelcodes) en het forum.
-- Uitvoeren: Supabase-dashboard -> SQL Editor -> plakken -> Run.
-- Vereist 003_beheer.sql (tabel profielen en functie met_2fa).
-- Veilig om vaker uit te voeren: bestaande rijen blijven ongewijzigd.
-- Let op: voer je 003_beheer.sql later nog eens uit, voer dan ook dit
-- bestand opnieuw uit (het vervangt de functie maak_profiel).
--
-- Beveiliging in het kort:
-- * Lezen mag iedereen, maar alleen zichtbare draden en berichten.
-- * Schrijven kan NIET rechtstreeks in de tabellen. Alles loopt via de
--   functies onderaan, die controleren dat de schrijver is ingelogd MET
--   tweefactorauthenticatie (aal2), niet geblokkeerd is en binnen de
--   limieten blijft (requirements W-FOR-04, W-ACC-02, W-ACC-06).
-- * Herstelcodes zijn alleen met de geheime serversleutel te lezen.

-- ---------------------------------------------------------------------------
-- 1. Gebruikersnaam bij het profiel
-- De tabel profielen (rol, talen) komt uit 003_beheer.sql. Hier krijgt elk
-- profiel een openbare gebruikersnaam voor het forum.
-- ---------------------------------------------------------------------------

alter table public.profielen
  add column if not exists gebruikersnaam text not null
    default ('lid-' || substr(md5(random()::text), 1, 8));

alter table public.profielen
  drop constraint if exists profielen_gebruikersnaam_vorm;
alter table public.profielen
  add constraint profielen_gebruikersnaam_vorm
    check (gebruikersnaam ~ '^[A-Za-z0-9_.-]{3,30}$');

create unique index if not exists profielen_gebruikersnaam_uniek
  on public.profielen (lower(gebruikersnaam));

-- Vervangt de functie uit 003_beheer.sql: maakt bij elk nieuw account een
-- profiel met de gebruikersnaam die bij registratie is opgegeven. Is die
-- naam al bezet of ongeldig, dan krijgt het profiel een unieke variant.
create or replace function public.maak_profiel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gewenst text := coalesce(new.raw_user_meta_data ->> 'gebruikersnaam', '');
  v_naam text;
begin
  if v_gewenst !~ '^[A-Za-z0-9_.-]{3,30}$' then
    v_gewenst := 'lid';
  end if;
  v_naam := v_gewenst;
  while exists (
    select 1 from public.profielen p where lower(p.gebruikersnaam) = lower(v_naam)
  ) loop
    v_naam := left(v_gewenst, 24) || '-' || substr(md5(random()::text), 1, 5);
  end loop;
  insert into public.profielen (id, gebruikersnaam) values (new.id, v_naam)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bij_nieuw_account on auth.users;
create trigger bij_nieuw_account
  after insert on auth.users
  for each row execute function public.maak_profiel();

-- Profielen voor accounts die al bestonden (bijvoorbeeld die van Winston).
insert into public.profielen (id)
select u.id from auth.users u
on conflict (id) do nothing;

-- Controle bij registratie of een gebruikersnaam nog vrij is.
create or replace function public.gebruikersnaam_vrij(p_naam text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profielen p where lower(p.gebruikersnaam) = lower(p_naam)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Blokkades (W-ADM-02)
-- ---------------------------------------------------------------------------

create table if not exists public.blokkades (
  id bigint generated always as identity primary key,
  gebruiker_id uuid not null references public.profielen (id) on delete cascade,
  tot timestamptz, -- leeg = permanent
  reden text not null default '',
  door uuid references public.profielen (id) on delete set null,
  aangemaakt timestamptz not null default now(),
  opgeheven timestamptz
);

create index if not exists blokkades_gebruiker_idx
  on public.blokkades (gebruiker_id);

-- ---------------------------------------------------------------------------
-- 3. Herstelcodes voor 2FA (W-ACC-04)
-- Alleen de server (met de geheime sleutel) leest en schrijft deze tabellen.
-- De codes zelf worden nooit opgeslagen, alleen een hash.
-- ---------------------------------------------------------------------------

create table if not exists public.herstelcodes (
  id bigint generated always as identity primary key,
  gebruiker_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  gebruikt_op timestamptz,
  aangemaakt timestamptz not null default now()
);

create index if not exists herstelcodes_gebruiker_idx
  on public.herstelcodes (gebruiker_id);

create table if not exists public.herstel_pogingen (
  id bigint generated always as identity primary key,
  gebruiker_id uuid not null references auth.users (id) on delete cascade,
  gelukt boolean not null,
  tijd timestamptz not null default now()
);

create index if not exists herstel_pogingen_idx
  on public.herstel_pogingen (gebruiker_id, tijd desc);

-- ---------------------------------------------------------------------------
-- 4. Forum (W-FOR-01 t/m -09)
-- ---------------------------------------------------------------------------

create table if not exists public.forum_draden (
  id bigint generated always as identity primary key,
  onderwerp text not null check (onderwerp in (
    'installatie', 'automatiseringen', 'dashboards', 'integraties',
    'claude-en-ai', 'hardware', 'overig'
  )),
  titel text not null check (char_length(titel) between 5 and 150),
  taal text not null check (taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  auteur_id uuid references public.profielen (id) on delete set null,
  status text not null default 'zichtbaar'
    check (status in ('zichtbaar', 'wacht', 'verborgen', 'verwijderd')),
  gesloten boolean not null default false,
  aantal_reacties integer not null default 0,
  laatste_activiteit timestamptz not null default now(),
  aangemaakt timestamptz not null default now()
);

create index if not exists forum_draden_lijst_idx
  on public.forum_draden (status, laatste_activiteit desc);
create index if not exists forum_draden_onderwerp_idx
  on public.forum_draden (onderwerp, status, laatste_activiteit desc);
create index if not exists forum_draden_auteur_idx
  on public.forum_draden (auteur_id, aangemaakt desc);

create table if not exists public.forum_berichten (
  id bigint generated always as identity primary key,
  draad_id bigint not null references public.forum_draden (id) on delete cascade,
  auteur_id uuid references public.profielen (id) on delete set null,
  tekst text not null check (char_length(tekst) between 2 and 20000),
  taal text not null check (taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  is_opening boolean not null default false,
  status text not null default 'zichtbaar'
    check (status in ('zichtbaar', 'wacht', 'verborgen', 'verwijderd')),
  aangemaakt timestamptz not null default now(),
  bewerkt timestamptz
);

create index if not exists forum_berichten_draad_idx
  on public.forum_berichten (draad_id, aangemaakt);
create index if not exists forum_berichten_auteur_idx
  on public.forum_berichten (auteur_id, aangemaakt desc);
create index if not exists forum_berichten_status_idx
  on public.forum_berichten (status) where status = 'wacht';

-- Vertalingen van berichten (W-FOR-03). Worden gevuld zodra de
-- vertaaldienst is gekozen (proef met Engels, B-04).
create table if not exists public.forum_vertalingen (
  bericht_id bigint not null references public.forum_berichten (id) on delete cascade,
  taal text not null check (taal in ('nl', 'en', 'zh', 'fr', 'de', 'es')),
  titel text,
  tekst text not null,
  handmatig_gecorrigeerd boolean not null default false,
  aangemaakt timestamptz not null default now(),
  primary key (bericht_id, taal)
);

-- Meldingen van bezoekers bij een bericht (W-FOR-08, W-ADM-03).
create table if not exists public.forum_meldingen (
  id bigint generated always as identity primary key,
  bericht_id bigint not null references public.forum_berichten (id) on delete cascade,
  melder_id uuid not null references public.profielen (id) on delete cascade,
  reden text not null check (char_length(reden) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'afgehandeld')),
  aangemaakt timestamptz not null default now(),
  afgehandeld_door uuid references public.profielen (id) on delete set null,
  afgehandeld_op timestamptz,
  unique (bericht_id, melder_id)
);

create index if not exists forum_meldingen_open_idx
  on public.forum_meldingen (status, aangemaakt);

-- Woorden die een bericht laten wachten op goedkeuring (W-ADM-05).
-- Aanvullen in de SQL Editor: insert into public.forum_filterwoorden values ('woord');
create table if not exists public.forum_filterwoorden (
  woord text primary key check (char_length(woord) >= 3)
);

insert into public.forum_filterwoorden (woord) values
  ('casino'), ('viagra'), ('crypto giveaway'), ('free followers')
on conflict do nothing;

-- Logboek van moderatie-acties (W-ADM-08).
create table if not exists public.moderatie_logboek (
  id bigint generated always as identity primary key,
  moderator_id uuid references public.profielen (id) on delete set null,
  actie text not null,
  doel_type text not null,
  doel_id text not null,
  reden text not null default '',
  tijd timestamptz not null default now()
);

create index if not exists moderatie_logboek_tijd_idx
  on public.moderatie_logboek (tijd desc);

-- ---------------------------------------------------------------------------
-- 5. Hulpfuncties
-- ---------------------------------------------------------------------------

-- Moderator of beheerder, en in deze sessie met 2FA ingelogd. Zonder 2FA
-- ziet ook een moderator geen verborgen berichten of meldingen.
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.met_2fa() and coalesce(
    (select p.rol in ('moderator', 'beheerder')
     from public.profielen p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_geblokkeerd(p_gebruiker uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blokkades b
    where b.gebruiker_id = p_gebruiker
      and b.opgeheven is null
      and (b.tot is null or b.tot > now())
  );
$$;

-- Weigert als de schrijver niet met 2FA is ingelogd of geblokkeerd is.
-- Foutcodes in hoofdletters worden door de website vertaald naar tekst.
create or replace function public._forum_controle_schrijver()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'NIET_INGELOGD';
  end if;
  if not public.met_2fa() then
    raise exception 'GEEN_2FA';
  end if;
  if not exists (select 1 from public.profielen p where p.id = uid) then
    raise exception 'GEEN_PROFIEL';
  end if;
  if public.is_geblokkeerd(uid) then
    raise exception 'GEBLOKKEERD';
  end if;
  return uid;
end;
$$;

-- Limiet op het aantal berichten per tijdseenheid (W-ACC-06).
create or replace function public._forum_controle_limiet(p_gebruiker uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.forum_berichten b
      where b.auteur_id = p_gebruiker
        and b.aangemaakt > now() - interval '10 minutes') >= 5
     or (select count(*) from public.forum_berichten b
         where b.auteur_id = p_gebruiker
           and b.aangemaakt > now() - interval '1 day') >= 50 then
    raise exception 'LIMIET_BERICHTEN';
  end if;
end;
$$;

-- Spamfilter (W-ADM-05): verdachte berichten wachten op goedkeuring.
-- Verdacht = een filterwoord, vier of meer links, of een link van een
-- account dat jonger is dan een dag.
create or replace function public._forum_spamstatus(p_gebruiker uuid, p_tekst text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  aantal_links integer;
  nieuw_account boolean;
begin
  if exists (
    select 1 from public.forum_filterwoorden f
    where p_tekst ilike '%' || f.woord || '%'
  ) then
    return 'wacht';
  end if;
  aantal_links := (
    select count(*) from regexp_matches(p_tekst, 'https?://', 'gi')
  );
  if aantal_links >= 4 then
    return 'wacht';
  end if;
  nieuw_account := exists (
    select 1 from public.profielen p
    where p.id = p_gebruiker and p.aangemaakt > now() - interval '1 day'
  );
  if aantal_links > 0 and nieuw_account then
    return 'wacht';
  end if;
  return 'zichtbaar';
end;
$$;

-- Houdt het aantal reacties en de laatste activiteit van een draad bij.
create or replace function public._forum_herbereken(p_draad bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.forum_draden d
  set aantal_reacties = (
        select count(*) from public.forum_berichten b
        where b.draad_id = d.id and not b.is_opening and b.status = 'zichtbaar'
      ),
      laatste_activiteit = coalesce(
        (select max(b.aangemaakt) from public.forum_berichten b
         where b.draad_id = d.id and b.status = 'zichtbaar'),
        d.aangemaakt
      )
  where d.id = p_draad;
$$;

create or replace function public._log(
  p_actie text, p_doel_type text, p_doel_id text, p_reden text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderatie_logboek (moderator_id, actie, doel_type, doel_id, reden)
  values (auth.uid(), p_actie, p_doel_type, p_doel_id, coalesce(p_reden, ''));
$$;

-- ---------------------------------------------------------------------------
-- 6. Schrijffuncties voor leden
-- ---------------------------------------------------------------------------

create or replace function public.forum_nieuwe_draad(
  p_onderwerp text, p_titel text, p_tekst text, p_taal text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
  v_status text;
  v_id bigint;
begin
  if (select count(*) from public.forum_draden d
      where d.auteur_id = uid and d.aangemaakt > now() - interval '1 hour') >= 3 then
    raise exception 'LIMIET_DRADEN';
  end if;
  perform public._forum_controle_limiet(uid);
  v_status := public._forum_spamstatus(uid, coalesce(p_titel, '') || ' ' || coalesce(p_tekst, ''));

  insert into public.forum_draden (onderwerp, titel, taal, auteur_id, status)
  values (p_onderwerp, btrim(p_titel), p_taal, uid, v_status)
  returning id into v_id;

  insert into public.forum_berichten (draad_id, auteur_id, tekst, taal, is_opening, status)
  values (v_id, uid, p_tekst, p_taal, true, v_status);

  return v_id;
end;
$$;

create or replace function public.forum_reageer(
  p_draad bigint, p_tekst text, p_taal text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
  v_status text;
  v_id bigint;
begin
  if not exists (
    select 1 from public.forum_draden d
    where d.id = p_draad and d.status = 'zichtbaar'
  ) then
    raise exception 'DRAAD_ONBEKEND';
  end if;
  if exists (select 1 from public.forum_draden d where d.id = p_draad and d.gesloten) then
    raise exception 'DRAAD_GESLOTEN';
  end if;
  perform public._forum_controle_limiet(uid);
  v_status := public._forum_spamstatus(uid, coalesce(p_tekst, ''));

  insert into public.forum_berichten (draad_id, auteur_id, tekst, taal, status)
  values (p_draad, uid, p_tekst, p_taal, v_status)
  returning id into v_id;

  perform public._forum_herbereken(p_draad);
  return v_id;
end;
$$;

-- Een lid verwijdert een eigen bericht (W-FOR-09). Bij het openingsbericht
-- verdwijnt de hele draad.
create or replace function public.forum_verwijder_eigen(p_bericht bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
  b record;
begin
  select * into b from public.forum_berichten
  where id = p_bericht and auteur_id = uid and status <> 'verwijderd';
  if not found then
    raise exception 'NIET_TOEGESTAAN';
  end if;
  update public.forum_berichten set status = 'verwijderd' where id = p_bericht;
  if b.is_opening then
    update public.forum_draden set status = 'verwijderd' where id = b.draad_id;
  end if;
  perform public._forum_herbereken(b.draad_id);
end;
$$;

-- Een bericht melden bij de moderator (W-FOR-08).
create or replace function public.forum_meld(p_bericht bigint, p_reden text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
begin
  if (select count(*) from public.forum_meldingen m
      where m.melder_id = uid and m.aangemaakt > now() - interval '1 day') >= 20 then
    raise exception 'LIMIET_MELDINGEN';
  end if;
  if not exists (select 1 from public.forum_berichten b where b.id = p_bericht) then
    raise exception 'BERICHT_ONBEKEND';
  end if;
  insert into public.forum_meldingen (bericht_id, melder_id, reden)
  values (p_bericht, uid, btrim(p_reden))
  on conflict (bericht_id, melder_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Moderatie (W-ADM-02, -03, -08)
-- ---------------------------------------------------------------------------

create or replace function public._controle_moderator()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := public._forum_controle_schrijver();
begin
  if not public.is_moderator() then
    raise exception 'GEEN_MODERATOR';
  end if;
  return uid;
end;
$$;

-- p_actie: 'tonen' (goedkeuren), 'verbergen' of 'verwijderen'.
create or replace function public.forum_modereer(
  p_bericht bigint, p_actie text, p_reden text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._controle_moderator();
  b record;
  nieuwe_status text;
begin
  nieuwe_status := case p_actie
    when 'tonen' then 'zichtbaar'
    when 'verbergen' then 'verborgen'
    when 'verwijderen' then 'verwijderd'
  end;
  if nieuwe_status is null then
    raise exception 'ONBEKENDE_ACTIE';
  end if;
  select * into b from public.forum_berichten where id = p_bericht;
  if not found then
    raise exception 'BERICHT_ONBEKEND';
  end if;

  update public.forum_berichten set status = nieuwe_status where id = p_bericht;
  if b.is_opening then
    update public.forum_draden set status = nieuwe_status where id = b.draad_id;
  end if;
  update public.forum_meldingen
  set status = 'afgehandeld', afgehandeld_door = uid, afgehandeld_op = now()
  where bericht_id = p_bericht and status = 'open';

  perform public._forum_herbereken(b.draad_id);
  perform public._log(p_actie, 'bericht', p_bericht::text, p_reden);
end;
$$;

-- Een melding afhandelen zonder iets aan het bericht te veranderen.
create or replace function public.forum_melding_afwijzen(p_melding bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._controle_moderator();
begin
  update public.forum_meldingen
  set status = 'afgehandeld', afgehandeld_door = uid, afgehandeld_op = now()
  where id = p_melding and status = 'open';
  perform public._log('melding-afgewezen', 'melding', p_melding::text, '');
end;
$$;

create or replace function public.forum_draad_sluiten(p_draad bigint, p_gesloten boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._controle_moderator();
  update public.forum_draden set gesloten = p_gesloten where id = p_draad;
  perform public._log(
    case when p_gesloten then 'draad-gesloten' else 'draad-geopend' end,
    'draad', p_draad::text, ''
  );
end;
$$;

-- Blokkeren: p_dagen leeg = permanent. Moderators kunnen geen moderators of
-- beheerders blokkeren; alleen de beheerder kan dat.
create or replace function public.blokkeer_gebruiker(
  p_gebruiker uuid, p_dagen integer, p_reden text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._controle_moderator();
  doelrol text;
  mijnrol text;
begin
  select rol into doelrol from public.profielen where id = p_gebruiker;
  select rol into mijnrol from public.profielen where id = uid;
  if doelrol is null then
    raise exception 'GEBRUIKER_ONBEKEND';
  end if;
  if p_gebruiker = uid
     or (doelrol in ('moderator', 'beheerder') and mijnrol <> 'beheerder') then
    raise exception 'NIET_TOEGESTAAN';
  end if;
  insert into public.blokkades (gebruiker_id, tot, reden, door)
  values (
    p_gebruiker,
    case when p_dagen is null then null else now() + make_interval(days => p_dagen) end,
    coalesce(p_reden, ''),
    uid
  );
  perform public._log(
    'blokkeren' || coalesce(' ' || p_dagen || ' dagen', ' permanent'),
    'gebruiker', p_gebruiker::text, p_reden
  );
end;
$$;

create or replace function public.deblokkeer_gebruiker(p_gebruiker uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._controle_moderator();
  update public.blokkades set opgeheven = now()
  where gebruiker_id = p_gebruiker and opgeheven is null;
  perform public._log('deblokkeren', 'gebruiker', p_gebruiker::text, '');
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Toegangsregels (Row Level Security)
-- ---------------------------------------------------------------------------

alter table public.blokkades enable row level security;
alter table public.herstelcodes enable row level security;
alter table public.herstel_pogingen enable row level security;
alter table public.forum_draden enable row level security;
alter table public.forum_berichten enable row level security;
alter table public.forum_vertalingen enable row level security;
alter table public.forum_meldingen enable row level security;
alter table public.forum_filterwoorden enable row level security;
alter table public.moderatie_logboek enable row level security;

-- Niemand schrijft rechtstreeks; alleen de functies hierboven en de server.
revoke insert, update, delete, truncate on
  public.profielen, public.blokkades, public.herstelcodes,
  public.herstel_pogingen, public.forum_draden, public.forum_berichten,
  public.forum_vertalingen, public.forum_meldingen,
  public.forum_filterwoorden, public.moderatie_logboek
from anon, authenticated;

-- Herstelcodes en pogingen: helemaal niet zichtbaar voor de browser.
revoke select on public.herstelcodes, public.herstel_pogingen,
  public.forum_filterwoorden
from anon, authenticated;

-- De server (geheime sleutel) beheert herstelcodes en pogingen.
grant select, insert, update, delete on public.herstelcodes, public.herstel_pogingen
to service_role;

grant select on public.forum_draden, public.forum_berichten,
  public.forum_vertalingen
to anon, authenticated;
grant select on public.profielen to authenticated;
grant select on public.blokkades, public.forum_meldingen, public.moderatie_logboek
to authenticated;

-- Gebruikersnamen en rollen zijn openbaar (ze staan bij elk bericht).
-- Bezoekers zonder account zien alleen deze drie kolommen.
drop policy if exists "Profielen zijn leesbaar" on public.profielen;
create policy "Profielen zijn leesbaar" on public.profielen
  for select to anon, authenticated using (true);
revoke select on public.profielen from anon;
grant select (id, gebruikersnaam, rol) on public.profielen to anon;

drop policy if exists "Eigen blokkades en moderators" on public.blokkades;
create policy "Eigen blokkades en moderators" on public.blokkades
  for select to authenticated
  using (gebruiker_id = auth.uid() or public.is_moderator());

drop policy if exists "Zichtbare draden zijn leesbaar" on public.forum_draden;
create policy "Zichtbare draden zijn leesbaar" on public.forum_draden
  for select to anon, authenticated
  using (
    status = 'zichtbaar'
    or (auteur_id = auth.uid() and status <> 'verwijderd')
    or public.is_moderator()
  );

drop policy if exists "Zichtbare berichten zijn leesbaar" on public.forum_berichten;
create policy "Zichtbare berichten zijn leesbaar" on public.forum_berichten
  for select to anon, authenticated
  using (
    (status = 'zichtbaar' and exists (
      select 1 from public.forum_draden d
      where d.id = draad_id and d.status = 'zichtbaar'
    ))
    or (auteur_id = auth.uid() and status <> 'verwijderd')
    or public.is_moderator()
  );

drop policy if exists "Vertalingen van leesbare berichten" on public.forum_vertalingen;
create policy "Vertalingen van leesbare berichten" on public.forum_vertalingen
  for select to anon, authenticated
  using (exists (
    select 1 from public.forum_berichten b where b.id = bericht_id
  ));

drop policy if exists "Eigen meldingen en moderators" on public.forum_meldingen;
create policy "Eigen meldingen en moderators" on public.forum_meldingen
  for select to authenticated
  using (melder_id = auth.uid() or public.is_moderator());

drop policy if exists "Logboek voor moderators" on public.moderatie_logboek;
create policy "Logboek voor moderators" on public.moderatie_logboek
  for select to authenticated
  using (public.is_moderator());

-- ---------------------------------------------------------------------------
-- 9. Wie mag welke functie aanroepen
-- ---------------------------------------------------------------------------

revoke execute on function
  public.maak_profiel(),
  public._forum_controle_schrijver(),
  public._forum_controle_limiet(uuid),
  public._forum_spamstatus(uuid, text),
  public._forum_herbereken(bigint),
  public._log(text, text, text, text),
  public._controle_moderator()
from public, anon, authenticated;

revoke execute on function
  public.forum_nieuwe_draad(text, text, text, text),
  public.forum_reageer(bigint, text, text),
  public.forum_verwijder_eigen(bigint),
  public.forum_meld(bigint, text),
  public.forum_modereer(bigint, text, text),
  public.forum_melding_afwijzen(bigint),
  public.forum_draad_sluiten(bigint, boolean),
  public.blokkeer_gebruiker(uuid, integer, text),
  public.deblokkeer_gebruiker(uuid)
from public, anon;

grant execute on function
  public.forum_nieuwe_draad(text, text, text, text),
  public.forum_reageer(bigint, text, text),
  public.forum_verwijder_eigen(bigint),
  public.forum_meld(bigint, text),
  public.forum_modereer(bigint, text, text),
  public.forum_melding_afwijzen(bigint),
  public.forum_draad_sluiten(bigint, boolean),
  public.blokkeer_gebruiker(uuid, integer, text),
  public.deblokkeer_gebruiker(uuid)
to authenticated;

-- Nodig in de toegangsregels en bij registratie.
revoke execute on function public.is_geblokkeerd(uuid) from public, anon, authenticated;

grant execute on function
  public.is_moderator(),
  public.gebruikersnaam_vrij(text)
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Jezelf beheerder maken en je forumnaam kiezen (eenmalig):
--   update public.profielen set rol = 'beheerder', gebruikersnaam = 'Winston'
--   where id = (select id from auth.users where email = 'jouw@adres.nl');
-- Iemand moderator maken:
--   update public.profielen set rol = 'moderator'
--   where gebruikersnaam = 'naam';
-- ---------------------------------------------------------------------------

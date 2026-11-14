-- 008_afbeelding_uitsnede.sql
-- Afbeelding met de hand bijsnijden (W-ADM-22, B-25).
--
-- afbeelding_url           = wat de site toont: de uitsnede (of, zonder
--                            uitsnede, de afbeelding zelf). Ongewijzigd.
-- afbeelding_origineel_url = de originele foto in Supabase Storage (map
--                            media): de eigen upload, of een kopie van de
--                            foto van internet.
-- afbeelding_bron_url      = de link op internet waar de foto vandaan kwam
--                            (leeg bij een eigen upload).
-- afbeelding_uitsnede      = het gekozen kader in procenten van het
--                            origineel, zodat je later opnieuw kunt
--                            bijsnijden: {"x":..,"y":..,"breedte":..,
--                            "hoogte":..,"verhouding":"16:9"|"vrij"}.
--
-- Veilig om vaker uit te voeren.

alter table public.artikelen
  add column if not exists afbeelding_origineel_url text,
  add column if not exists afbeelding_bron_url text,
  add column if not exists afbeelding_uitsnede jsonb;

alter table public.artikelen
  drop constraint if exists artikelen_afbeelding_uitsnede_vorm;
alter table public.artikelen
  add constraint artikelen_afbeelding_uitsnede_vorm check (
    afbeelding_uitsnede is null
    or (
      jsonb_typeof(afbeelding_uitsnede) = 'object'
      and jsonb_typeof(afbeelding_uitsnede -> 'x') = 'number'
      and jsonb_typeof(afbeelding_uitsnede -> 'y') = 'number'
      and jsonb_typeof(afbeelding_uitsnede -> 'breedte') = 'number'
      and jsonb_typeof(afbeelding_uitsnede -> 'hoogte') = 'number'
    )
  );

comment on column public.artikelen.afbeelding_origineel_url is
  'Originele foto (eigen upload of kopie van internet) in Storage, map media.';
comment on column public.artikelen.afbeelding_bron_url is
  'Link op internet waar de foto vandaan kwam; leeg bij eigen upload.';
comment on column public.artikelen.afbeelding_uitsnede is
  'Gekozen kader in procenten van het origineel; afbeelding_url is de uitsnede.';

-- PostgREST (de API van Supabase) de nieuwe kolommen laten zien.
notify pgrst, 'reload schema';

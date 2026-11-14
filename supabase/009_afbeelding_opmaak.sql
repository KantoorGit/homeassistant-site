-- 009_afbeelding_opmaak.sql
-- Nieuwe 16:9-foto maken uit het origineel (W-ADM-23, B-26).
--
-- Volgorde van een afbeelding bij een artikel:
--   origineel (afbeelding_origineel_url)
--   → eventueel een zelf opgemaakte 16:9-foto (afbeelding_opmaak_url): de
--     foto op een 16:9-vlak, met zelf gekozen breedte, hoogte en plek, en een
--     achtergrond voor de lege ruimte
--   → eventueel een uitsnede daarvan (afbeelding_uitsnede)
--   → afbeelding_url = wat de site toont.
--
-- afbeelding_opmaak = de gekozen opmaak, in procenten van het 16:9-vlak,
--   zodat je hem later kunt aanpassen:
--   {"x":..,"y":..,"breedte":..,"hoogte":..,"vast":true,"achtergrond":"#ffffff"|"vervaagd"}
-- Het kader in afbeelding_uitsnede is vanaf nu in procenten van de
-- 16:9-foto als die er is, anders van het origineel.
--
-- Veilig om vaker uit te voeren.

alter table public.artikelen
  add column if not exists afbeelding_opmaak_url text,
  add column if not exists afbeelding_opmaak jsonb;

alter table public.artikelen
  drop constraint if exists artikelen_afbeelding_opmaak_vorm;
alter table public.artikelen
  add constraint artikelen_afbeelding_opmaak_vorm check (
    afbeelding_opmaak is null
    or (
      jsonb_typeof(afbeelding_opmaak) = 'object'
      and jsonb_typeof(afbeelding_opmaak -> 'x') = 'number'
      and jsonb_typeof(afbeelding_opmaak -> 'y') = 'number'
      and jsonb_typeof(afbeelding_opmaak -> 'breedte') = 'number'
      and jsonb_typeof(afbeelding_opmaak -> 'hoogte') = 'number'
    )
  );

comment on column public.artikelen.afbeelding_opmaak_url is
  'Zelf opgemaakte 16:9-foto (uit het origineel) in Storage, map media.';
comment on column public.artikelen.afbeelding_opmaak is
  'Opmaak van de 16:9-foto: plek en grootte van de foto in procenten van het vlak, achtergrond.';

notify pgrst, 'reload schema';

-- Migration 788: a flock has TWO seasons, not one.
--
-- The breed standard is published per season for the GROWING weeks as well as
-- the laying ones, and a flock reared through one season commonly lays through
-- the other -- Flock 19 was brooded in February and laid into the following
-- winter. The flock record has only ever held laying_season, so every screen
-- reading a growing standard either used the laying season (wrong curve) or
-- guessed the season from the placement month.
--
-- The guess is a reasonable default and stays as the fallback, but a stored
-- value beats a guess, and the farm knows which season it reared in.
--
-- Only females are affected: the male standards are stored as season 'Both'.

ALTER TABLE public.flocks
  ADD COLUMN IF NOT EXISTS rearing_season TEXT;

ALTER TABLE public.flocks
  DROP CONSTRAINT IF EXISTS flocks_rearing_season_check;

ALTER TABLE public.flocks
  ADD CONSTRAINT flocks_rearing_season_check
  CHECK (rearing_season IS NULL OR rearing_season IN ('Summer','Winter'));

COMMENT ON COLUMN public.flocks.rearing_season IS
  'Season the chicks were brooded and grown in, for weeks 1-24 of the breed standard. Left NULL, screens fall back to the placement month (Feb-Jul Summer, Aug-Jan Winter).';

SELECT 'column' AS chk,
       (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'flocks'
           AND column_name = 'rearing_season') AS added,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || flock_no
                 || ' placed=' || COALESCE(placement_date::text, '-')
                 || ' rear=' || COALESCE(rearing_season, 'not set')
                 || ' lay=' || COALESCE(laying_season, 'not set') AS t
            FROM public.flocks
       ) x) AS flocks_now;

NOTIFY pgrst, 'reload schema';

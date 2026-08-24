-- Migration 892: remove the single test row inserted by migration 890, to avoid
-- a duplicate before the full gap-window insert (migration 891) runs.
DELETE FROM public.daily_records WHERE id = '8918655e-9818-43a1-b05a-2db020eb8f75';

SELECT 'cleanup_check' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE id = '8918655e-9818-43a1-b05a-2db020eb8f75';

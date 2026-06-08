-- Migration 020: Clear F19 and F20 daily records so seeds re-insert with correct hd_pct
-- Root cause: old DB data had wrong opening_female values causing hd_pct up to 413%
-- Fix: delete records so the seed INSERT runs fresh on every deploy (idempotent).

DELETE FROM public.daily_records
WHERE flock_id IN (
  SELECT id FROM public.flocks WHERE flock_no IN ('19', '20')
);

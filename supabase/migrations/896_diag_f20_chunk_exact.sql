-- Migration 896 (READ ONLY): exact count present for 2025-12-02 to 2025-12-08
-- (the specific 50-row chunk from migration 894), to confirm whether it landed.
SELECT 'chunk_present' AS chk, count(*)::int AS n
  FROM public.daily_records d
 WHERE d.remarks = 'F20_IMPORT_2026-08-24'
   AND d.record_date BETWEEN '2025-12-02' AND '2025-12-08';

-- Migration 018: Deduplicate employees with same name + farm
-- Root cause: salary extraction created a new emp_id every month for the same person
-- Result: 535 people with multiple IDs (up to 27 per person), salary history fragmented
-- Fix: One canonical UUID per (name, farm_id), all salary records remapped to it

-- ─── Step 1: canonical UUID per (name, farm_id) ─────────────────────────────
-- Preference order: NF-EMP-* > BPS/BPW/PPS/PPW > alphabetically first EMP*
CREATE TEMP TABLE emp_canonical AS
SELECT
  UPPER(TRIM(name))        AS norm_name,
  farm_id,
  (ARRAY_AGG(id ORDER BY
      CASE
        WHEN emp_id LIKE 'NF-EMP-%'            THEN 0
        WHEN emp_id ~ '^(BPS|BPW|PPS|PPW)\d+' THEN 1
        ELSE 2
      END,
      emp_id ASC
  ))[1]                    AS canonical_id
FROM public.employees
GROUP BY UPPER(TRIM(name)), farm_id;

-- ─── Step 2: old_id → canonical_id mapping ──────────────────────────────────
CREATE TEMP TABLE emp_remap AS
SELECT e.id AS old_id, c.canonical_id AS new_id
FROM public.employees e
JOIN emp_canonical c
  ON  UPPER(TRIM(e.name)) = c.norm_name
  AND (   (e.farm_id = c.farm_id)
       OR (e.farm_id IS NULL AND c.farm_id IS NULL)
      )
WHERE e.id <> c.canonical_id;

-- ─── Step 3: resolve month conflicts ────────────────────────────────────────
-- If canonical already has a salary row for the same month as a duplicate row,
-- keep whichever has the higher net_salary; delete the loser.
DELETE FROM public.salary_monthly sm
USING emp_remap r
WHERE sm.employee_id = r.old_id
  AND EXISTS (
    SELECT 1 FROM public.salary_monthly sm2
    WHERE sm2.employee_id  = r.new_id
      AND sm2.month        = sm.month
      AND sm2.net_salary  >= COALESCE(sm.net_salary, 0)
  );

-- For the reverse case (duplicate has higher net_salary), delete canonical's row
-- so the UPDATE in Step 4 will insert the better record
DELETE FROM public.salary_monthly sm
USING emp_remap r
WHERE sm.employee_id = r.new_id
  AND EXISTS (
    SELECT 1 FROM public.salary_monthly sm2
    WHERE sm2.employee_id = r.old_id
      AND sm2.month       = sm.month
      AND sm2.net_salary  > COALESCE(sm.net_salary, 0)
  );

-- ─── Step 4: remap remaining salary records to canonical UUID ────────────────
UPDATE public.salary_monthly sm
SET employee_id = r.new_id
FROM emp_remap r
WHERE sm.employee_id = r.old_id;

-- ─── Step 5: delete duplicate employee rows ──────────────────────────────────
DELETE FROM public.employees
WHERE id IN (SELECT old_id FROM emp_remap);

DROP TABLE emp_canonical;
DROP TABLE emp_remap;

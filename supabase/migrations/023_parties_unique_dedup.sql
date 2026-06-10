-- Migration 023: Deduplicate parties + add unique constraint on (LOWER(TRIM(name)), type)
-- Wrapped in single DO block so TEMP TABLEs persist across all steps (session-scoped).

DO $$
BEGIN

  -- Step 1: canonical UUID per (LOWER(TRIM(name)), type)
  -- Keep the row with the earliest created_at (or smallest id as tiebreak)
  CREATE TEMP TABLE parties_canonical AS
  SELECT
    LOWER(TRIM(name)) AS norm_name,
    type,
    (ARRAY_AGG(id ORDER BY created_at ASC NULLS LAST, id ASC))[1] AS canonical_id
  FROM public.parties
  GROUP BY LOWER(TRIM(name)), type;

  -- Step 2: old_id → canonical_id for all non-canonical rows
  CREATE TEMP TABLE parties_remap AS
  SELECT p.id AS old_id, c.canonical_id AS new_id
  FROM public.parties p
  JOIN parties_canonical c
    ON  LOWER(TRIM(p.name)) = c.norm_name
    AND p.type              = c.type
  WHERE p.id <> c.canonical_id;

  -- Step 3: remap foreign keys in all referencing tables
  UPDATE public.grn         SET party_id = r.new_id FROM parties_remap r WHERE party_id = r.old_id;
  UPDATE public.he_dispatch SET party_id = r.new_id FROM parties_remap r WHERE party_id = r.old_id;
  UPDATE public.nhe_sales   SET party_id = r.new_id FROM parties_remap r WHERE party_id = r.old_id;

  -- Step 4: delete duplicate party rows
  DELETE FROM public.parties WHERE id IN (SELECT old_id FROM parties_remap);

  DROP TABLE parties_canonical;
  DROP TABLE parties_remap;

END;
$$ LANGUAGE plpgsql;

-- Step 5: add unique constraint (outside DO block — DDL on permanent tables)
CREATE UNIQUE INDEX IF NOT EXISTS parties_name_type_unique
  ON public.parties (LOWER(TRIM(name)), type);

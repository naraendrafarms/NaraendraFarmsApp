-- medicines_master.type has a hard CHECK constraint (001_schema.sql) while
-- the UI's Type dropdown is driven by config_options('medicine_type') - an
-- admin-added new type always failed to save with a raw constraint error.
-- Drop the CHECK; the config table is now the source of truth for valid
-- types. Constraint name found dynamically (same pattern as migration 336).
DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'medicines_master' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%type%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.medicines_master DROP CONSTRAINT %I', cname);
  END IF;
END $$;

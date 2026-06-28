-- Migration 187: Make Daily/Bulk Entry medicine list reflect ITEMS MASTER.
-- Items with a medicine-type category are synced into medicines_master (the table the
-- medicine dropdowns + medicine_usage FK use), and a trigger keeps future items in sync.
-- This gives "pick medicines from Items Master" without breaking existing usage/reports.

-- ── 1. One-time backfill: items (medicine categories) → medicines_master (by name) ──
INSERT INTO public.medicines_master (name, type, unit, manufacturer, is_active)
SELECT i.name,
       CASE LOWER(i.category)
         WHEN 'vaccine' THEN 'vaccine'
         WHEN 'injectable' THEN 'injectable'
         WHEN 'supplement' THEN 'supplement'
         WHEN 'sanitizer' THEN 'sanitizer'
         WHEN 'disinfectant' THEN 'disinfectant'
         WHEN 'pesticide' THEN 'pesticide'
         ELSE 'medicine' END,
       COALESCE(i.unit, 'Nos'),
       i.manufacturer,
       TRUE
FROM public.items i
WHERE i.category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')
  AND i.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.medicines_master m WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(i.name))
  );

-- ── 2. Trigger: keep medicines_master in sync when item medicines are added/edited ──
CREATE OR REPLACE FUNCTION public.fn_sync_item_to_medicine()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')
     AND COALESCE(NEW.is_active, TRUE) = TRUE THEN
    IF NOT EXISTS (SELECT 1 FROM public.medicines_master m WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(NEW.name))) THEN
      INSERT INTO public.medicines_master (name, type, unit, manufacturer, is_active)
      VALUES (NEW.name,
        CASE LOWER(NEW.category)
          WHEN 'vaccine' THEN 'vaccine' WHEN 'injectable' THEN 'injectable'
          WHEN 'supplement' THEN 'supplement' WHEN 'sanitizer' THEN 'sanitizer'
          WHEN 'disinfectant' THEN 'disinfectant' WHEN 'pesticide' THEN 'pesticide'
          ELSE 'medicine' END,
        COALESCE(NEW.unit,'Nos'), NEW.manufacturer, TRUE);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_item_medicine ON public.items;
CREATE TRIGGER trg_sync_item_medicine
  AFTER INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_item_to_medicine();

-- Verify
SELECT 'medicines_master' AS tbl, COUNT(*) AS rows FROM public.medicines_master;

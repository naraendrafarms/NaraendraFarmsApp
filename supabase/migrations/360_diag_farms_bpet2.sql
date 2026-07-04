-- Migration 360: check if a farm with code BPET2 or a bodjanampet-2-like name
-- already exists under a different name (electricity meter comments in the
-- codebase reference BPET1/BPET2 as known farm codes).
SELECT id, name, code, site_type, is_active FROM public.farms WHERE code ILIKE '%bpet2%' OR name ILIKE '%bodjanampet%';

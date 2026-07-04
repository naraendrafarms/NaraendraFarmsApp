-- Migration 361: correct the actual gap — flock 21's laying_farm_id was
-- already correctly pointing to the real "Bodjanampet - 2 (VHL)" farm all
-- along (migration 358's diagnosis was wrong, based on an exact-name search
-- that didn't match "Bodjanampet - 2 (VHL)"). rearing_farm_id pointing
-- elsewhere is expected (birds are reared 0-16 weeks at a different site,
-- transferred to Bodjanampet-2 for laying). The only real gap is the
-- is_vhl_contract flag never got set because migration 358's UPDATE also
-- filtered by farm name and found nothing.

-- A. Confirm rearing_farm_id resolves to a real farm (not dangling)
SELECT id, name, code, site_type FROM public.farms WHERE id = '62909634-e044-4232-bda7-7302b3a15f26';

UPDATE public.flocks SET is_vhl_contract = TRUE WHERE flock_no = '21';

-- Verify
SELECT flock_no, is_vhl_contract, laying_farm_id, rearing_farm_id FROM public.flocks WHERE flock_no = '21';

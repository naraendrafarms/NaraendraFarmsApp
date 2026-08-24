-- Migration 812: repair the one stale row migration 811 found -- Flock 20,
-- shed 4, record_date 2026-08-24, cull_female=1 with zero matching nhe_sales
-- (the cull sale was edited to 2026-08-23 and this old row was never
-- recomputed, which the just-shipped fix now prevents going forward).
-- Zero the cull here and recompute trcull/closing the same way the app's own
-- syncShedCull() does, rather than just blanking the number.

UPDATE public.daily_records d
   SET cull_female = 0,
       trcull_female = COALESCE(d.transfer_female, 0),
       trcull_male   = COALESCE(d.transfer_male, 0),
       closing_female = GREATEST(0, COALESCE(d.opening_female,0) - COALESCE(d.transfer_female,0) - COALESCE(d.mortality_female,0)),
       closing_male   = GREATEST(0, COALESCE(d.opening_male,0)   - COALESCE(d.transfer_male,0)   - COALESCE(d.mortality_male,0))
 WHERE d.id = 'ca64daf6-c629-461f-bf54-dba5ed39cce4';

SELECT 'repaired' AS chk, id, record_date, shed_id, cull_female, cull_male, trcull_female, closing_female
  FROM public.daily_records WHERE id = 'ca64daf6-c629-461f-bf54-dba5ed39cce4';

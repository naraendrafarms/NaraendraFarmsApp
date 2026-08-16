-- Vendor rate rules that vary by FLOCK AGE, for the Hitech agreement.
--
-- The rule, in the farm's own words: "35% less upto 29/7 week and from 30/1
-- regular, meaning Association Rate - 1.5, for all flocks, to Hitech Hatch
-- Fresh Pvt Ltd". 29/7 and 30/1 are AGES -- week 29 day 7 and week 30 day 1 --
-- not calendar dates.
--
-- The two parts CHAIN, in this order, confirmed by the farm's own worked
-- example: Association 25.75 - 1.5 = 24.25, then 35% off = 15.76.
--   effective = (association + diff) * (1 - pct_less/100)
-- Doing it the other way round (35% off the association first, then -1.5)
-- gives 15.24 -- a different number on every invoice, which is why the order
-- is written down here rather than left to whoever reads the code next.
--
-- Age is held in DAYS ELAPSED since placement, because week/day notation is
-- ambiguous about which end it counts from and money should not rest on that.
-- The convention used, matching how the farm writes it:
--     placement day = week 1 day 1 = 0 days elapsed
--     week W day D  = (W-1)*7 + (D-1) days elapsed
--     so 29/7 = 202 days, and 30/1 = 203 days.
-- The 35% tier therefore runs 0..202 days and the regular tier starts at 203.
--
-- The existing flat table (he_vendor_rate_diff, one row per vendor with no age
-- and no percentage) is NOT dropped -- the dispatch form falls back to it for
-- any vendor with no tiers, so nothing that works today stops working.

CREATE TABLE IF NOT EXISTS public.he_vendor_rate_tier (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      uuid NOT NULL,
  flock_id      uuid,                          -- NULL = every flock
  age_from_days int  NOT NULL DEFAULT 0,
  age_to_days   int,                           -- NULL = no upper limit
  diff          numeric NOT NULL DEFAULT 0,    -- added to the Association rate
  pct_less      numeric NOT NULL DEFAULT 0,    -- then this % taken off
  remarks       text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_he_vendor_rate_tier_party ON public.he_vendor_rate_tier (party_id, age_from_days);

-- Seed the Hitech agreement, matched on the exact party name that carries the
-- dispatches. There are three lookalike parties -- "Hitech Hatch Fresh Private
-- Limited" (21 dispatches), the same name + " Advance" (0), and "Venkateswara
-- B. V. Biocorp Pvt Ltd - Hitech Div" (0) -- so the name is matched exactly
-- rather than with a LIKE that would hit all three.
INSERT INTO public.he_vendor_rate_tier (party_id, flock_id, age_from_days, age_to_days, diff, pct_less, remarks)
SELECT p.id, NULL, 0, 202, -1.5, 35, 'Young flock: upto 29/7 — (Association − 1.50) less 35%'
FROM public.parties p
WHERE p.name = 'Hitech Hatch Fresh Private Limited'
  AND NOT EXISTS (SELECT 1 FROM public.he_vendor_rate_tier t WHERE t.party_id = p.id AND t.age_from_days = 0);

INSERT INTO public.he_vendor_rate_tier (party_id, flock_id, age_from_days, age_to_days, diff, pct_less, remarks)
SELECT p.id, NULL, 203, NULL, -1.5, 0, 'Regular: from 30/1 — Association − 1.50'
FROM public.parties p
WHERE p.name = 'Hitech Hatch Fresh Private Limited'
  AND NOT EXISTS (SELECT 1 FROM public.he_vendor_rate_tier t WHERE t.party_id = p.id AND t.age_from_days = 203);

-- VERIFY 2: both tiers seeded against the party that actually has dispatches.
SELECT COALESCE(string_agg(p.name || ': ' || t.age_from_days || '-' || COALESCE(t.age_to_days::text,'open')
       || ' days, diff=' || t.diff || ', less ' || t.pct_less || '%', ' | ' ORDER BY t.age_from_days), 'NONE') AS tiers
FROM public.he_vendor_rate_tier t JOIN public.parties p ON p.id = t.party_id;

-- VERIFY 3: the farm's worked example must come back as 15.76.
SELECT ROUND((25.75 + t.diff) * (1 - t.pct_less/100), 2)::text AS young_rate_on_2575,
       ROUND((25.75 + t2.diff) * (1 - t2.pct_less/100), 2)::text AS regular_rate_on_2575
FROM public.he_vendor_rate_tier t
JOIN public.he_vendor_rate_tier t2 ON t2.party_id = t.party_id AND t2.age_from_days = 203
WHERE t.age_from_days = 0;

-- VERIFY 4: nothing already invoiced is disturbed. Every existing dispatch is
-- from a flock well past 203 days, so the regular tier is the one that applies
-- and it equals the -1.50 already in use.
SELECT COUNT(*)::text AS hitech_dispatches,
       COUNT(*) FILTER (WHERE (d.dispatch_date - f.placement_date) < 203)::text AS would_fall_in_the_35pct_tier,
       COALESCE(MIN(d.dispatch_date - f.placement_date)::text,'-') AS youngest_flock_age_days
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE p.name = 'Hitech Hatch Fresh Private Limited' AND f.placement_date IS NOT NULL;

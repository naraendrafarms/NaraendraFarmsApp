-- Required manpower per site, by designation and gender.
--
-- Checked first: no required, sanctioned or manpower column exists anywhere in
-- the database, so "how many helpers are required" could not be answered at
-- all -- the app knew only how many there ARE. This is the master that makes
-- Required vs Actual vs Short possible.
--
-- gender is nullable on purpose: some roles are required as a headcount without
-- being male or female specific (a supervisor is a supervisor), and forcing a
-- gender on those would invent a distinction the farm does not make.
CREATE TABLE IF NOT EXISTS public.manpower_requirement (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  designation    text NOT NULL,
  gender         text CHECK (gender IN ('Male','Female')),
  required_count int  NOT NULL DEFAULT 0 CHECK (required_count >= 0),
  remarks        text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (farm_id, designation, gender)
);

CREATE INDEX IF NOT EXISTS idx_manpower_req_farm ON public.manpower_requirement (farm_id);

-- RLS WITH a policy. Enabled without one denies every write, which is how the
-- Cull Bird page shipped broken.
ALTER TABLE public.manpower_requirement ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.manpower_requirement;
CREATE POLICY "auth_all" ON public.manpower_requirement FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'MISSING') AS columns_created
FROM information_schema.columns WHERE table_schema='public' AND table_name='manpower_requirement';

SELECT (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname='public' AND tablename='manpower_requirement') AS policies,
       (SELECT COUNT(*)::text FROM public.manpower_requirement) AS rows_now;

-- The helper headcount the master will be set against, per site, so the first
-- entries can be made from real numbers.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NONE') AS helpers_per_site
FROM (
  SELECT COALESCE(f.name,'(no site)') || ': M' || COUNT(*) FILTER (WHERE e.gender='Male')
         || ' F' || COUNT(*) FILTER (WHERE e.gender='Female') AS line
  FROM public.employees e LEFT JOIN public.farms f ON f.id = e.farm_id
  WHERE e.is_active AND e.designation ILIKE '%helper%'
  GROUP BY f.name
) x;

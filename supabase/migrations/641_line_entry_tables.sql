-- Line-level entry, step 3 of 5: the three tables shed staff actually write to.
--
--   line_production  4 rounds a day, counts only
--   line_mortality   female/male, with a reason
--   line_feed        kg by feed type, split female/male
--
-- Grades are deliberately absent. Grading happens once at day end by the site
-- manager on daily_records, exactly as today; the rounds record counts only.
--
-- round_no is 1..4 with UNIQUE (line_id, record_date, round_no) so the same
-- round cannot be entered twice -- with twenty to thirty people entering from
-- different phones, a double entry is the normal failure, not the rare one.
--
-- entered_by / entered_at are on every row for the same reason: a disagreement
-- about a figure is unresolvable without them.
--
-- All the DDL is in one DO block so that the verification lands inside the
-- first five statements, which is all run_sql.py prints.

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.line_production (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_id     UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    round_no    INTEGER NOT NULL CHECK (round_no BETWEEN 1 AND 4),
    eggs        INTEGER NOT NULL DEFAULT 0 CHECK (eggs >= 0),
    remarks     TEXT,
    entered_by  UUID REFERENCES public.profiles(id),
    entered_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (line_id, record_date, round_no)
  );

  CREATE TABLE IF NOT EXISTS public.line_mortality (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_id     UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    female      INTEGER NOT NULL DEFAULT 0 CHECK (female >= 0),
    male        INTEGER NOT NULL DEFAULT 0 CHECK (male >= 0),
    reason      TEXT,
    remarks     TEXT,
    entered_by  UUID REFERENCES public.profiles(id),
    entered_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (line_id, record_date)
  );

  CREATE TABLE IF NOT EXISTS public.line_feed (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_id      UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    record_date  DATE NOT NULL,
    feed_type_id UUID REFERENCES public.feed_types(id),
    female_kg    NUMERIC(10,2) NOT NULL DEFAULT 0,
    male_kg      NUMERIC(10,2) NOT NULL DEFAULT 0,
    remarks      TEXT,
    entered_by   UUID REFERENCES public.profiles(id),
    entered_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (line_id, record_date, feed_type_id)
  );

  ALTER TABLE public.line_production ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.line_mortality  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.line_feed       ENABLE ROW LEVEL SECURITY;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "auth_all" ON public.line_production FOR ALL
      USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "auth_all" ON public.line_mortality FOR ALL
      USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "auth_all" ON public.line_feed FOR ALL
      USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- VERIFY (statement 3): all three tables exist, with their column counts.
SELECT COALESCE(string_agg(t || '=' || c || ' cols', ', ' ORDER BY t), 'NO TABLES CREATED') AS tables_created
FROM (SELECT table_name AS t, COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('line_production','line_mortality','line_feed')
       GROUP BY table_name) x;

-- VERIFY (statement 4): the duplicate-entry guards are real constraints, not
-- intentions -- one unique constraint per table, listed by definition.
SELECT COALESCE(string_agg(conrelid::regclass::text || ': ' || pg_get_constraintdef(oid), ' | '
                ORDER BY conrelid::regclass::text), 'NO UNIQUE CONSTRAINTS') AS duplicate_guards
FROM pg_constraint
WHERE contype = 'u'
  AND conrelid IN ('public.line_production'::regclass,
                   'public.line_mortality'::regclass,
                   'public.line_feed'::regclass);

-- VERIFY (statement 5): all three are empty, and RLS is on for each. Nothing is
-- live until lines exist and a shed is switched on (migration 644).
SELECT (SELECT COUNT(*) FROM public.line_production) AS production_rows,
       (SELECT COUNT(*) FROM public.line_mortality)  AS mortality_rows,
       (SELECT COUNT(*) FROM public.line_feed)       AS feed_rows,
       (SELECT string_agg(relname || '=' || relrowsecurity, ', ' ORDER BY relname)
          FROM pg_class WHERE relname IN ('line_production','line_mortality','line_feed')) AS rls_enabled;

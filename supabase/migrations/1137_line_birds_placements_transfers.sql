-- Migration 1137: give a LINE its birds. Without this the mortality entry
-- built in 1133 had nothing to subtract from, so no line could show a position.
--
-- What was missing, in the owner's words:
--   * birds per box -- it is 2, and it was nowhere in the data or the screens.
--   * line to line transfer -- birds move between lines and there was no way
--     to record it, so a line's count could never be right.
--   * a line's own bird balance -- mortality was enterable but meaningless.
--
-- MODEL (mirrors how the shed level already works, one level down):
--   line_placements  birds put INTO a line for a flock, on a date.
--   line_transfers   birds moved FROM one line TO another.
--   line_mortality   already exists, morning + day (migration 1133).
--   v_line_balance   placed + moved in - moved out - mortality = current.
--
-- birds_per_box defaults to 2 and sits on the line, not hardcoded, because a
-- line with a different box size later must not force a code change. Capacity
-- is boxes * birds_per_box and is DERIVED -- never stored twice, so it cannot
-- drift away from the box count the way total_boxes has.
--
-- A transfer is allowed BETWEEN ANY TWO LINES, not only within one shed: birds
-- move between sheds at this farm and forcing same-shed would make those
-- unrecordable. from_line and to_line must differ.
--
-- Still nothing writes to daily_records. The line side stays separate and is
-- only ever compared, as instructed.

DO $$
BEGIN
  ALTER TABLE public.shed_lines ADD COLUMN IF NOT EXISTS birds_per_box INTEGER NOT NULL DEFAULT 2;

  CREATE TABLE IF NOT EXISTS public.line_placements (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_id     UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    flock_id    UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
    placed_date DATE NOT NULL,
    female      INTEGER NOT NULL DEFAULT 0 CHECK (female >= 0),
    male        INTEGER NOT NULL DEFAULT 0 CHECK (male >= 0),
    remarks     TEXT,
    entered_by  UUID REFERENCES public.profiles(id),
    entered_at  TIMESTAMPTZ DEFAULT NOW(),
    -- One placement row per line per flock. Adding birds later is a transfer
    -- in, not a second placement, so the starting figure stays unambiguous.
    UNIQUE (line_id, flock_id)
  );

  CREATE TABLE IF NOT EXISTS public.line_transfers (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flock_id      UUID NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
    transfer_date DATE NOT NULL,
    from_line_id  UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    to_line_id    UUID NOT NULL REFERENCES public.shed_lines(id) ON DELETE CASCADE,
    female        INTEGER NOT NULL DEFAULT 0 CHECK (female >= 0),
    male          INTEGER NOT NULL DEFAULT 0 CHECK (male >= 0),
    remarks       TEXT,
    entered_by    UUID REFERENCES public.profiles(id),
    entered_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT line_transfer_not_same CHECK (from_line_id <> to_line_id),
    CONSTRAINT line_transfer_not_empty CHECK (female > 0 OR male > 0)
  );

  ALTER TABLE public.line_placements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.line_transfers  ENABLE ROW LEVEL SECURITY;
END
$$;

-- Policies. Same four roles that enter a day, management read-only, matching
-- what migration 1133 did for the other three line tables.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['line_placements','line_transfers']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "line_entry_select" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "line_entry_write" ON public.%I', t);
    EXECUTE format($p$CREATE POLICY "line_entry_select" ON public.%I FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge','management')))$p$, t);
    EXECUTE format($p$CREATE POLICY "line_entry_write" ON public.%I FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                     WHERE p.id = (SELECT auth.uid())
                       AND p.role IN ('admin','shed_supervisor','site_manager','site_incharge')))$p$, t);
  END LOOP;
END
$$;

-- The balance view. DROP first -- CREATE OR REPLACE fails silently when column
-- names or order change.
DO $$
BEGIN
  DROP VIEW IF EXISTS public.v_line_balance;
  CREATE VIEW public.v_line_balance AS
  WITH pairs AS (
    SELECT line_id, flock_id FROM public.line_placements
    UNION
    SELECT to_line_id, flock_id FROM public.line_transfers
    UNION
    SELECT from_line_id, flock_id FROM public.line_transfers
  )
  SELECT pr.line_id, pr.flock_id,
         l.shed_id, l.side, l.line_no,
         l.boxes, l.birds_per_box,
         (COALESCE(l.boxes,0) * l.birds_per_box) AS capacity_birds,
         COALESCE(pl.female,0) AS placed_female,
         COALESCE(pl.male,0)   AS placed_male,
         COALESCE(ti.f,0) AS in_female,  COALESCE(ti.m,0) AS in_male,
         COALESCE(tou.f,0) AS out_female, COALESCE(tou.m,0) AS out_male,
         COALESCE(mo.f,0) AS mort_female, COALESCE(mo.m,0) AS mort_male,
         GREATEST(0, COALESCE(pl.female,0) + COALESCE(ti.f,0) - COALESCE(tou.f,0) - COALESCE(mo.f,0)) AS current_female,
         GREATEST(0, COALESCE(pl.male,0)   + COALESCE(ti.m,0) - COALESCE(tou.m,0) - COALESCE(mo.m,0)) AS current_male
  FROM pairs pr
  JOIN public.shed_lines l ON l.id = pr.line_id
  LEFT JOIN public.line_placements pl ON pl.line_id = pr.line_id AND pl.flock_id = pr.flock_id
  LEFT JOIN (SELECT to_line_id AS lid, flock_id, sum(female) f, sum(male) m
             FROM public.line_transfers GROUP BY 1,2) ti
         ON ti.lid = pr.line_id AND ti.flock_id = pr.flock_id
  LEFT JOIN (SELECT from_line_id AS lid, flock_id, sum(female) f, sum(male) m
             FROM public.line_transfers GROUP BY 1,2) tou
         ON tou.lid = pr.line_id AND tou.flock_id = pr.flock_id
  -- line_mortality is not per flock, so it is attributed to the line's pair.
  -- A line holds one flock at a time, so this is exact in practice.
  LEFT JOIN (SELECT line_id AS lid, sum(female) f, sum(male) m
             FROM public.line_mortality GROUP BY 1) mo
         ON mo.lid = pr.line_id;
END
$$;

-- VERIFY 1: the column, the two tables and their policies exist; capacity is
-- derivable; and the Agraharam boxes now imply a bird capacity at 2 per box.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='shed_lines' AND column_name='birds_per_box') AS has_birds_per_box,
       (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema='public' AND table_name IN ('line_placements','line_transfers')) AS new_tables,
       (SELECT count(*)::int FROM pg_policies WHERE schemaname='public'
        AND tablename IN ('line_placements','line_transfers')) AS new_policies,
       (SELECT sum(l.boxes * l.birds_per_box)::int
        FROM public.shed_lines l JOIN public.sheds s ON s.id=l.shed_id
        JOIN public.farms f ON f.id=s.farm_id WHERE f.name='Agraharam Potlapally') AS agraharam_capacity_birds;

-- VERIFY 2: the view exists and returns (nothing yet -- no placements), and
-- nothing that already existed moved.
SELECT (SELECT count(*)::int FROM information_schema.views
        WHERE table_schema='public' AND table_name='v_line_balance') AS view_exists,
       (SELECT count(*)::int FROM public.v_line_balance) AS balance_rows,
       (SELECT count(*)::int FROM public.shed_lines) AS shed_lines_rows,
       (SELECT count(*)::int FROM public.line_mortality) AS mortality_rows,
       (SELECT count(*)::int FROM public.daily_records) AS daily_records_untouched;

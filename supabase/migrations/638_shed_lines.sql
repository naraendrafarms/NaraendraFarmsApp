-- Line-level entry, step 1 of 5: the shed_lines table.
--
-- A line is the physical row of cages inside a shed, under the A side or the B
-- side. Nothing in the database has ever held one: migration 637 confirmed that
-- every %line% column in the schema is an address line or a purchase-order line
-- item. The uploaded workbook (DOC20260815WA0026) is a shed CAPACITY sheet --
-- shed no, type, sex, A side box, B side box, total box, birds, water tank --
-- and contains no line breakdown at all, so this table is created EMPTY.
-- Lines are entered from the real line sheet when it arrives; nothing here
-- guesses at them.
--
-- is_provisional exists so that any row entered as an estimate can say so on
-- screen rather than presenting a guess as a measurement.
--
-- Creating this table changes no existing behaviour: nothing reads it yet.

CREATE TABLE IF NOT EXISTS public.shed_lines (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shed_id         UUID NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
  side            TEXT NOT NULL CHECK (side IN ('A','B')),
  line_no         INTEGER NOT NULL CHECK (line_no > 0),
  boxes           INTEGER,
  capacity_female INTEGER,
  capacity_male   INTEGER,
  is_provisional  BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shed_id, side, line_no)
);

ALTER TABLE public.shed_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.shed_lines FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- VERIFY (statement 4): the table and its columns really exist. run_sql.py
-- prints only the first five statements, so the checks sit inside them.
SELECT COUNT(*) AS shed_lines_columns,
       COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS cols
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shed_lines';

-- VERIFY (statement 5): it is empty, and the uniqueness guard is in place --
-- the same shed/side/line cannot be created twice.
SELECT (SELECT COUNT(*) FROM public.shed_lines) AS rows_should_be_zero,
       (SELECT COUNT(*) FROM pg_constraint
         WHERE conrelid = 'public.shed_lines'::regclass AND contype = 'u') AS unique_constraints,
       (SELECT COUNT(*) FROM public.sheds WHERE is_active) AS active_sheds_awaiting_lines;

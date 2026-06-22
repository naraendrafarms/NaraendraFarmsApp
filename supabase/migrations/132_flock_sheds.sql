-- Migration 132: Allow multiple sheds per flock via flock_sheds link table

CREATE TABLE IF NOT EXISTS public.flock_sheds (
  flock_id uuid NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  shed_id  uuid NOT NULL REFERENCES public.sheds(id)  ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (flock_id, shed_id)
);

ALTER TABLE public.flock_sheds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flock_sheds' AND policyname='fs_select') THEN
    CREATE POLICY "fs_select" ON public.flock_sheds FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flock_sheds' AND policyname='fs_insert') THEN
    CREATE POLICY "fs_insert" ON public.flock_sheds FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flock_sheds' AND policyname='fs_delete') THEN
    CREATE POLICY "fs_delete" ON public.flock_sheds FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

GRANT ALL ON public.flock_sheds TO authenticated;

-- Seed link table from existing single current_shed_id assignments
INSERT INTO public.flock_sheds (flock_id, shed_id)
SELECT id, current_shed_id
FROM public.flocks
WHERE current_shed_id IS NOT NULL
ON CONFLICT (flock_id, shed_id) DO NOTHING;

-- Diagnostic
SELECT count(*) AS flock_shed_links FROM public.flock_sheds;

NOTIFY pgrst, 'reload schema';

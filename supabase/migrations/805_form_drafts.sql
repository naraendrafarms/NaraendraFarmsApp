-- In-progress form data, saved to the database instead of the browser, so a
-- power-cut or a closed tab doesn't cost a re-entry -- and so a draft started
-- on one machine can be picked up on another. A draft is never the real
-- record: it only feeds the form fields back on reopen. Saving still goes
-- through the page's normal insert/update path and its normal validation, so
-- a draft can never become a duplicate row by itself -- it is deleted the
-- moment the real save succeeds, or the moment the user discards it.
CREATE TABLE IF NOT EXISTS public.form_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_key     TEXT NOT NULL,
  record_key   TEXT NOT NULL DEFAULT 'new',
  form_data    JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_key, record_key)
);

CREATE INDEX IF NOT EXISTS idx_form_drafts_lookup ON public.form_drafts (user_id, page_key, record_key);

ALTER TABLE public.form_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS form_drafts_own ON public.form_drafts;
CREATE POLICY form_drafts_own ON public.form_drafts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

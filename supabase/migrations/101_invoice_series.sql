-- Migration 101: Invoice number series (per client/type) with atomic next-number
-- Formats are LOCKED to match invoices already filed in Tally for Apr-May 2026.

CREATE TABLE IF NOT EXISTS public.invoice_series (
  code        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  template    TEXT NOT NULL,           -- placeholders {FY} and {N}
  fy          TEXT NOT NULL DEFAULT '26-27',
  current_no  INTEGER NOT NULL DEFAULT 0,
  pad         INTEGER NOT NULL DEFAULT 0,  -- zero-pad width for the number (0 = none)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed series with last-used numbers (next() returns current_no + 1)
INSERT INTO public.invoice_series (code, label, template, fy, current_no, pad) VALUES
  ('HHF',  'Hitech Hatch Fresh Pvt Ltd', 'NF/HHF/{FY}/{N}',  '26-27', 50, 0),
  ('HE',   'Hatching Eggs (other)',      'NF/HE/{FY}/{N}',   '26-27', 7,  0),
  ('NHE',  'Non-Hatching Eggs',          'NF/{FY}/NHE/{N}',  '26-27', 2,  0),
  ('VHPL', 'VHPL',                       'NF/VHPL/{FY}/{N}', '26-27', 2,  0),
  ('CB',   'Cull Birds',                 'NF/CB/{FY}/{N}',   '26-27', 15, 2)
ON CONFLICT (code) DO NOTHING;

-- RLS
ALTER TABLE public.invoice_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_series_select" ON public.invoice_series;
DROP POLICY IF EXISTS "invoice_series_insert" ON public.invoice_series;
DROP POLICY IF EXISTS "invoice_series_update" ON public.invoice_series;
DROP POLICY IF EXISTS "invoice_series_delete" ON public.invoice_series;
CREATE POLICY "invoice_series_select" ON public.invoice_series FOR SELECT USING (true);
CREATE POLICY "invoice_series_insert" ON public.invoice_series FOR INSERT WITH CHECK (true);
CREATE POLICY "invoice_series_update" ON public.invoice_series FOR UPDATE USING (true);
CREATE POLICY "invoice_series_delete" ON public.invoice_series FOR DELETE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_series TO authenticated, anon;

-- Atomic next-number: increments and returns the formatted invoice number
CREATE OR REPLACE FUNCTION public.fn_next_invoice(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_no INT;
  v_template TEXT;
  v_fy TEXT;
  v_pad INT;
  v_numtxt TEXT;
BEGIN
  UPDATE public.invoice_series
     SET current_no = current_no + 1
   WHERE code = p_code
  RETURNING current_no, template, fy, pad INTO v_no, v_template, v_fy, v_pad;

  IF v_no IS NULL THEN
    RAISE EXCEPTION 'Invoice series % not found', p_code;
  END IF;

  IF v_pad > 0 THEN
    v_numtxt := lpad(v_no::text, v_pad, '0');
  ELSE
    v_numtxt := v_no::text;
  END IF;

  RETURN replace(replace(v_template, '{FY}', v_fy), '{N}', v_numtxt);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_next_invoice(TEXT) TO authenticated, anon;

-- Diagnostic
SELECT code, current_no, replace(replace(template,'{FY}',fy),'{N}',(current_no+1)::text) AS next_preview
FROM public.invoice_series ORDER BY code;

-- fn_peek_invoice: read next invoice number WITHOUT incrementing the counter.
-- Used by the Generate button to show a preview. The actual counter is only
-- consumed inside fn_next_invoice which is called at Save time.
CREATE OR REPLACE FUNCTION public.fn_peek_invoice(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$
DECLARE
  v_next  INTEGER;
  v_tmpl  TEXT;
  v_fy    TEXT;
  v_pad   INTEGER;
  v_label TEXT;
BEGIN
  SELECT current_no + 1, template, fy, pad
    INTO v_next, v_tmpl, v_fy, v_pad
    FROM public.invoice_series
   WHERE code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown invoice series: %', p_code;
  END IF;

  v_label := replace(replace(v_tmpl, '{FY}', v_fy), '{N}',
               CASE WHEN v_pad > 0 THEN lpad(v_next::TEXT, v_pad, '0') ELSE v_next::TEXT END);

  RETURN v_label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_peek_invoice(TEXT) TO authenticated, anon;

-- Migration 1268: the invoice series restarts at 1 when the financial year
-- turns, instead of carrying last year's number under a new label.
--
-- Owner's rule, 18/09/2026: the year runs 1 April to 31 March, and the first
-- invoice of a new year is number 1, not a continuation.
--
-- Until now fy and current_no were plain stored values that nothing advanced,
-- so on 1 April 2027 HHF would have carried on at 79 still labelled 26-27.
--
-- The roll happens INSIDE the atomic UPDATE in fn_next_invoice, so two people
-- saving at the same moment across the year boundary cannot both reset it and
-- both take number 1. In an UPDATE the right hand side of SET reads the OLD
-- row, so "fy = v_now_fy" below is comparing the STORED year against today's.
--
-- Deleting a dispatch still does NOT return its number: the owner asked for
-- the gap to stay. A number that has been on a filed document should not come
-- back, and reusing it risks two documents sharing one number.
SELECT 1 AS warmup;

CREATE OR REPLACE FUNCTION public.fn_current_fy(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS
$$
  SELECT lpad(((CASE WHEN EXTRACT(MONTH FROM p_date) >= 4
                     THEN EXTRACT(YEAR FROM p_date)
                     ELSE EXTRACT(YEAR FROM p_date) - 1 END)::int % 100)::text, 2, '0')
      || '-'
      || lpad(((CASE WHEN EXTRACT(MONTH FROM p_date) >= 4
                     THEN EXTRACT(YEAR FROM p_date) + 1
                     ELSE EXTRACT(YEAR FROM p_date) END)::int % 100)::text, 2, '0');
$$;

CREATE OR REPLACE FUNCTION public.fn_next_invoice(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS
$$
DECLARE
  v_no INT; v_template TEXT; v_fy TEXT; v_pad INT; v_numtxt TEXT; v_now_fy TEXT;
BEGIN
  v_now_fy := public.fn_current_fy();

  UPDATE public.invoice_series
     SET fy = v_now_fy,
         current_no = CASE WHEN fy = v_now_fy THEN current_no + 1 ELSE 1 END
   WHERE code = p_code
  RETURNING current_no, template, fy, pad INTO v_no, v_template, v_fy, v_pad;

  IF v_no IS NULL THEN
    RAISE EXCEPTION 'Invoice series % not found', p_code;
  END IF;

  IF v_pad > 0 THEN v_numtxt := lpad(v_no::text, v_pad, '0');
  ELSE v_numtxt := v_no::text; END IF;

  RETURN replace(replace(v_template, '{FY}', v_fy), '{N}', v_numtxt);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_peek_invoice(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$
DECLARE
  v_next INTEGER; v_tmpl TEXT; v_pad INTEGER; v_now_fy TEXT;
BEGIN
  v_now_fy := public.fn_current_fy();

  SELECT CASE WHEN fy = v_now_fy THEN current_no + 1 ELSE 1 END, template, pad
    INTO v_next, v_tmpl, v_pad
    FROM public.invoice_series
   WHERE code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown invoice series: %', p_code;
  END IF;

  RETURN replace(replace(v_tmpl, '{FY}', v_now_fy), '{N}',
           CASE WHEN v_pad > 0 THEN lpad(v_next::TEXT, v_pad, '0') ELSE v_next::TEXT END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_current_fy(DATE)  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_next_invoice(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_peek_invoice(TEXT) TO authenticated, anon;

-- The year boundary, proved at the edges without touching any data.
SELECT public.fn_current_fy(DATE '2026-09-18') AS today_is,
       public.fn_current_fy(DATE '2027-03-31') AS last_day_of_this_fy,
       public.fn_current_fy(DATE '2027-04-01') AS first_day_of_next_fy,
       public.fn_current_fy(DATE '2028-03-31') AS last_day_of_next_fy,
       public.fn_current_fy(DATE '2028-04-01') AS the_year_after;

-- Peek still reads right today, and still consumes nothing.
SELECT code, current_no, fy, public.fn_peek_invoice(code) AS peek_now
FROM public.invoice_series ORDER BY code;

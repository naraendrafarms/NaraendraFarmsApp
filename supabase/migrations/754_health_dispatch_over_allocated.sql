-- Migration 754: a dispatch cannot have more eggs SET against it than it
-- carried.
--
-- A dispatch legitimately feeds several settings — a lakh eggs are split across
-- hatcheries — so the link dropdown keeps offering an invoice while any eggs
-- remain. What must never happen is the same invoice being linked to two full
-- batches: that records twice the eggs that ever left the farm, and every hatch
-- percentage measured against them is then measured against eggs that did not
-- exist. The form now refuses it; this rule catches any that slipped in before,
-- or through an import.

CREATE OR REPLACE FUNCTION public.fn_check_dispatch_allocation(p_run TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE plpgsql AS
$$
DECLARE
  v_count INTEGER; v_detail TEXT;
BEGIN
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '') INTO v_count, v_detail FROM (
    SELECT COALESCE(d.invoice_no, 'DC-' || COALESCE(d.dc_no::text, '?'))
           || ' carried ' || COALESCE(d.total_dispatched, 0)::text
           || ' but ' || b.setts::text || ' eggs set across ' || b.n::text || ' batches' AS d
    FROM public.he_dispatch d
    JOIN LATERAL (SELECT COALESCE(sum(hb.eggs_set), 0) AS setts, count(*) AS n
                  FROM public.hatch_batches hb WHERE hb.dispatch_id = d.id) b ON TRUE
    WHERE b.n > 0 AND COALESCE(d.total_dispatched, 0) > 0
      AND b.setts > COALESCE(d.total_dispatched, 0)
    ORDER BY b.setts - COALESCE(d.total_dispatched, 0) DESC
    LIMIT 20) x;

  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'dispatch_over_allocated', 'More eggs set than the invoice carried', 'Hatchery', 'critical', v_count, v_detail,
          'The same dispatch is linked to batches totalling more eggs than it held, so hatch percentages are measured against eggs that never existed.');
  RETURN v_count;
END;
$$;

SELECT 'function' AS chk, count(*)::int AS n FROM pg_proc WHERE proname = 'fn_check_dispatch_allocation';

SELECT 'current_state' AS chk, count(*)::int AS over_allocated_dispatches
FROM public.he_dispatch d
JOIN LATERAL (SELECT COALESCE(sum(hb.eggs_set), 0) AS setts, count(*) AS n
              FROM public.hatch_batches hb WHERE hb.dispatch_id = d.id) b ON TRUE
WHERE b.n > 0 AND COALESCE(d.total_dispatched, 0) > 0 AND b.setts > COALESCE(d.total_dispatched, 0);

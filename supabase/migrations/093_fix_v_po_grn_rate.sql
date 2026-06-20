-- Migration 093: Fix v_po_grn_rate — item_name join was case-sensitive exact match
-- so 'maize' != 'Maize' != 'MAIZE' → po_no and po_rate came back NULL.
-- Switch to lower(trim(...)) comparison and also expose the matched PO item name
-- so the UI can show what was matched.

DROP VIEW IF EXISTS public.v_po_grn_rate;
CREATE VIEW public.v_po_grn_rate AS
  SELECT
    g.grn_no,
    g.grn_date,
    g.item_name                              AS grn_item_name,
    p.name                                   AS vendor_name,
    g.price_per_unit                         AS grn_rate,
    po.rate                                  AS po_rate,
    po.po_no,
    po.po_item_name,
    po.vendor_name                           AS po_vendor_name,
    (g.price_per_unit - po.rate)             AS rate_diff
  FROM public.grn g
  LEFT JOIN public.parties p ON p.id = g.party_id
  LEFT JOIN LATERAL (
    SELECT
      po2.rate,
      po2.po_no,
      po2.item_name  AS po_item_name,
      po2.vendor_name
    FROM public.purchase_orders po2
    WHERE lower(trim(po2.item_name)) = lower(trim(g.item_name))
      AND po2.rate IS NOT NULL
    ORDER BY
      -- prefer matching vendor (same party name)
      CASE WHEN lower(trim(po2.vendor_name)) = lower(trim(COALESCE(p.name,''))) THEN 0 ELSE 1 END,
      po2.po_date DESC NULLS LAST
    LIMIT 1
  ) po ON TRUE
  WHERE g.price_per_unit IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- Diagnostic: confirm view exists
SELECT count(*) AS view_ready
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'v_po_grn_rate';

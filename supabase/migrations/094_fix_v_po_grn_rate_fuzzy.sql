-- Migration 094: v_po_grn_rate — add substring fallback matching
-- Problem: GRN item "Flyvin 1 Kg" vs PO item "FLYVIN" — exact + case-insensitive
-- still fails because the strings differ. Add a second LATERAL that tries
-- substring/contains matching so "FLYVIN" matches "Flyvin 1 Kg".

DROP VIEW IF EXISTS public.v_po_grn_rate;
CREATE VIEW public.v_po_grn_rate AS
  SELECT
    g.grn_no,
    g.grn_date,
    g.item_name                              AS grn_item_name,
    p.name                                   AS vendor_name,
    g.price_per_unit                         AS grn_rate,
    COALESCE(po_exact.rate, po_fuzzy.rate)   AS po_rate,
    COALESCE(po_exact.po_no, po_fuzzy.po_no) AS po_no,
    COALESCE(po_exact.po_item_name, po_fuzzy.po_item_name) AS po_item_name,
    COALESCE(po_exact.vendor_name, po_fuzzy.vendor_name)   AS po_vendor_name,
    (g.price_per_unit - COALESCE(po_exact.rate, po_fuzzy.rate)) AS rate_diff
  FROM public.grn g
  LEFT JOIN public.parties p ON p.id = g.party_id
  -- Pass 1: case-insensitive exact match
  LEFT JOIN LATERAL (
    SELECT po2.rate, po2.po_no,
           po2.item_name  AS po_item_name,
           po2.vendor_name
    FROM public.purchase_orders po2
    WHERE lower(trim(po2.item_name)) = lower(trim(g.item_name))
      AND po2.rate IS NOT NULL
    ORDER BY
      CASE WHEN lower(trim(po2.vendor_name)) = lower(trim(COALESCE(p.name,''))) THEN 0 ELSE 1 END,
      po2.po_date DESC NULLS LAST
    LIMIT 1
  ) po_exact ON TRUE
  -- Pass 2: substring match (only used when exact match found nothing)
  LEFT JOIN LATERAL (
    SELECT po2.rate, po2.po_no,
           po2.item_name  AS po_item_name,
           po2.vendor_name
    FROM public.purchase_orders po2
    WHERE po_exact.po_no IS NULL
      AND po2.rate IS NOT NULL
      AND po2.item_name IS NOT NULL
      AND (
        lower(trim(g.item_name))    LIKE '%' || lower(trim(po2.item_name)) || '%'
        OR lower(trim(po2.item_name)) LIKE '%' || lower(trim(g.item_name))  || '%'
      )
    ORDER BY
      CASE WHEN lower(trim(po2.vendor_name)) = lower(trim(COALESCE(p.name,''))) THEN 0 ELSE 1 END,
      -- prefer longer PO item names (more specific match)
      length(po2.item_name) DESC,
      po2.po_date DESC NULLS LAST
    LIMIT 1
  ) po_fuzzy ON TRUE
  WHERE g.price_per_unit IS NOT NULL;

NOTIFY pgrst, 'reload schema';

SELECT count(*) AS view_ready
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'v_po_grn_rate';

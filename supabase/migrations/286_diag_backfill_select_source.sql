-- The literal-value probe (285) proved writes persist fine across
-- statements. So migration 283's INSERT...SELECT (with JOIN/GROUP BY/
-- LATERAL) must itself be returning zero source rows. Run that exact SELECT
-- standalone (no INSERT) to see what it produces.
SELECT
  p.name, p.id, g.grn_no, MIN(g.grn_date) AS grn_date, MIN(g.invoice_no) AS invoice_no,
  MIN(g.invoice_date) AS invoice_date,
  SUM(COALESCE(g.total_amount, g.basic_amount, 0)) AS total,
  po.credit_limit_days
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
LEFT JOIN LATERAL (
  SELECT credit_limit_days FROM public.purchase_orders
  WHERE po_no = g.po_no AND credit_limit_days IS NOT NULL LIMIT 1
) po ON true
WHERE g.grn_no IN ('2758','2759','2760','2761')
GROUP BY p.name, p.id, g.grn_no, po.credit_limit_days;

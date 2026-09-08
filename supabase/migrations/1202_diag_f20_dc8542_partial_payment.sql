-- Read-only. The Flock 20 egg sale DC 8542, 05/09/2026, Meghana Agencies,
-- Rs 36,996: Rs 30,000 was received and Rs 6,996 is still due, but the list
-- shows it as fully received. Measure what is actually stored before changing
-- anything, and how many other sales are in the same state.

-- 1. The sale
SELECT s.id::text, s.sale_date::text, s.dc_no, s.amount::numeric,
       COALESCE(s.amount_received,0)::numeric AS amount_received,
       (s.amount - COALESCE(s.amount_received,0))::numeric AS still_due,
       COALESCE(s.payment_cash,0)::numeric AS payment_cash,
       COALESCE(s.payment_online,0)::numeric AS payment_online,
       COALESCE(s.payment_status,'(null)') AS payment_status,
       COALESCE(s.payment_mode,'(null)') AS payment_mode,
       COALESCE(p.name,'-') AS party
FROM public.nhe_sales s
LEFT JOIN public.parties p ON p.id = s.party_id
WHERE s.dc_no = '8542' AND s.sale_date = '2026-09-05';

-- 2. Its cash book row - what actually reached a tin
SELECT cb.amount_in::numeric, COALESCE(fa.name,'(no site)') AS site,
       COALESCE(ca.name,'(derived)') AS imprest
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
LEFT JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
WHERE s.dc_no = '8542' AND s.sale_date = '2026-09-05';

-- 3. How widespread: sales marked Received that are short of their own amount
SELECT count(*)::int AS marked_received_but_short,
       COALESCE(sum(s.amount - COALESCE(s.amount_received,0)),0)::numeric AS total_still_due,
       COALESCE(min(s.sale_date)::text,'-') || ' -> ' || COALESCE(max(s.sale_date)::text,'-') AS span
FROM public.nhe_sales s
WHERE s.payment_status = 'Received'
  AND COALESCE(s.amount_received,0) + 0.005 < s.amount;

-- 4. Same for hatching-egg dispatches, so the answer is not half the picture
SELECT count(*)::int AS he_marked_received_but_short,
       COALESCE(sum(d.amount - COALESCE(d.amount_received,0) - COALESCE(d.tds_amount,0)),0)::numeric AS total_still_due
FROM public.he_dispatch d
WHERE d.payment_status = 'Received'
  AND COALESCE(d.amount_received,0) + COALESCE(d.tds_amount,0) + 0.005 < d.amount;

-- 5. And how many egg sales lost their cash/online split entirely
SELECT count(*)::int AS cash_sales,
       count(*) FILTER (WHERE COALESCE(payment_cash,0) = 0 AND COALESCE(payment_online,0) = 0)::int AS split_not_stored
FROM public.nhe_sales
WHERE COALESCE(amount_received,0) > 0;

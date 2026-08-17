-- Diagnostic only. The More Than Solutions rows themselves -- the earlier runs
-- truncated this statement twice, so it is asked on its own and kept short.
SELECT COALESCE(string_agg(line, ' || ' ORDER BY line), 'NO ROWS') AS mts_rows
FROM (
  SELECT id::text || ' grn=' || COALESCE(NULLIF(grn_no,''),'(blank)')
      || ' inv=' || COALESCE(NULLIF(invoice_no,''),'(blank)')
      || ' amt=' || COALESCE(invoice_amount::text,'-')
      || ' paid=' || COALESCE(paid_amount::text,'0')
      || ' st=' || COALESCE(payment_status,'(null)') AS line
  FROM public.pending_payments WHERE vendor_name ILIKE '%More Than Solutions%'
) x;

-- The row the 1,17,000 bank debit points at: is IT the one showing Pending?
SELECT COALESCE(string_agg('grn=' || COALESCE(NULLIF(p.grn_no,''),'(blank)')
      || ' inv=' || COALESCE(NULLIF(p.invoice_no,''),'(blank)')
      || ' amt=' || COALESCE(p.invoice_amount::text,'-')
      || ' paid=' || COALESCE(p.paid_amount::text,'0')
      || ' st=' || COALESCE(p.payment_status,'(null)'), ' | '), 'LINKED ROW MISSING') AS row_behind_the_bank_debit
FROM public.pending_payments p
WHERE p.id = 'f6e9cbc5-35f4-40ea-95e2-2951c8aa29b7';

-- GRN 2743 itself: how many GRN lines, and do they all carry the same number?
SELECT COALESCE(string_agg('grn_no=' || COALESCE(grn_no,'(null)')
      || ' inv=' || COALESCE(invoice_no,'(null)')
      || ' amt=' || COALESCE(COALESCE(total_amount, basic_amount)::text,'-')
      || ' item=' || COALESCE(item_name,'-'), ' | '), 'NO GRN ROWS') AS grn_2743_lines
FROM public.grn WHERE grn_no = '2743';

-- And whether any cash_book entry also exists for it, which would mean the
-- payment was recorded twice in different ledgers.
SELECT COUNT(*)::text AS cash_book_entries_for_mts
FROM public.cash_book WHERE party_name ILIKE '%More Than Solutions%';

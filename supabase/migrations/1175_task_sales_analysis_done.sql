-- Migration 1175: the consolidated sales report shipped today, so its task is
-- ticked off in the same session rather than left standing.
--
-- Nothing outside public.tasks is touched.

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 04/09/2026: Reports -> Sales Analysis (all sales). Reads he_dispatch + he_dispatch_lines and nhe_sales + nhe_sale_lines together. The summary groups by vendor, flock, sale type or month and shows invoices, sales, grade A/B/C and the HE/JE/TE/BE/bird/manure/other quantities side by side; the line-by-line detail sits underneath and both halves export to CSV. Filters: vendor, flock, sale type, financial year, date range, and whether employee sales are included. A row is one sale LINE, so a sale billing JE and TE is two rows but still one invoice and one sale. Lines win over the header wherever both hold the same figures, the rule nheEggsLeavingStock already sets for free eggs. Amount is deliberately NOT split by grade: an HE rate is per production date, so A and B eggs on one line share a rate and no per-grade revenue exists in the data. Built as a new report rather than folded into the Sales Invoice Register, which is an invoice list and not a quantity-and-rate analysis.'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title = 'One consolidated sales report - flock, vendor, grade and type in a single view';

-- VERIFY: it is closed, and the other four raised today are still open.
SELECT count(*) FILTER (WHERE status = 'done')::int AS closed,
       count(*) FILTER (WHERE status <> 'done')::int AS still_open,
       string_agg(title || ' [' || status || ']', ' | ' ORDER BY title) AS state
FROM public.tasks
WHERE task_type = 'development'
  AND title IN (
    'Farm expenses reach no flock, so Financial and Cost & Income understate cost',
    'Four farm expenses never reached the cash book - Rs 1,32,655 in no balance',
    'Head Office and Feed Mill expenses belong to no imprest - 140 rows, Rs 3,80,995',
    'One consolidated sales report - flock, vendor, grade and type in a single view',
    'Migration runner prints only the first five statements');

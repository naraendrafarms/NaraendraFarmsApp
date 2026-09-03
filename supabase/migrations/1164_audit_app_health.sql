-- Migration 1164: read-only audit of the database side.
--
-- The owner's concern is fair: a lot has changed in a short time -- line entry,
-- imprest accounts, RLS locks on the money tables, salary/sale settlement, view
-- rewrites. This checks the things that break QUIETLY, where a screen keeps
-- rendering and a figure is simply wrong.
--
-- Nothing is written.

-- [1] WRITE EXPOSURE. Migration 001 gave EVERY table blanket auth_insert /
-- auth_update / auth_delete policies, so any signed-in user could write it.
-- daily_records and the four money tables were locked; this counts how many
-- tables still carry a policy that lets anyone write.
SELECT count(DISTINCT tablename)::int AS tables_any_user_can_write,
       (SELECT count(DISTINCT tablename)::int FROM pg_policies
        WHERE schemaname='public') AS tables_with_any_policy,
       (SELECT string_agg(DISTINCT tablename, ', ' ORDER BY tablename)
        FROM pg_policies p2
        WHERE p2.schemaname='public' AND p2.cmd <> 'SELECT'
          AND p2.qual IS NOT NULL AND p2.qual NOT ILIKE '%profiles%'
          AND p2.tablename IN ('cash_book','bank_transactions','nhe_sales','he_dispatch',
                               'daily_records','pending_payments','salary_monthly',
                               'employee_advances','employee_deductions','farm_expenses',
                               'cash_accounts','flocks','sheds')) AS key_tables_still_open
FROM pg_policies
WHERE schemaname='public' AND cmd <> 'SELECT'
  AND qual IS NOT NULL AND qual NOT ILIKE '%profiles%';

-- [2] BROKEN LINKS. Rows pointing at a parent that no longer exists, which show
-- as blanks on screen rather than errors.
SELECT (SELECT count(*)::int FROM public.cash_book cb
        WHERE cb.nhe_sale_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.nhe_sales s WHERE s.id = cb.nhe_sale_id)) AS cash_rows_orphan_sale,
       (SELECT count(*)::int FROM public.cash_book cb
        WHERE cb.farm_expense_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.farm_expenses f WHERE f.id = cb.farm_expense_id)) AS cash_rows_orphan_expense,
       (SELECT count(*)::int FROM public.employee_deductions d
        WHERE d.nhe_sale_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.nhe_sales s WHERE s.id = d.nhe_sale_id)) AS deductions_orphan_sale,
       (SELECT count(*)::int FROM public.farm_expenses fe
        WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.farm_expense_id = fe.id)) AS expenses_never_in_cash_book;

-- [3] HALF TRANSFERS. Both legs share transfer_group_id; a group with one leg
-- means a transfer was half-deleted and a book is out by that amount.
SELECT COALESCE((SELECT count(*)::int FROM (
         SELECT transfer_group_id FROM public.cash_book WHERE transfer_group_id IS NOT NULL
         UNION ALL
         SELECT transfer_group_id FROM public.bank_transactions WHERE transfer_group_id IS NOT NULL
       ) g GROUP BY transfer_group_id HAVING count(*) <> 2), 0) AS unbalanced_transfer_groups,
       (SELECT count(DISTINCT transfer_group_id)::int FROM public.cash_book
        WHERE transfer_group_id IS NOT NULL) AS cash_transfer_groups;

-- [4] SETTLEMENT CONSISTENCY. A sale marked Received with nothing recorded as
-- received, or Pending while its deduction has already been taken.
SELECT count(*) FILTER (WHERE payment_status='Received'
                          AND COALESCE(amount_received,0) = 0 AND amount > 0)::int AS received_but_nothing_recorded,
       count(*) FILTER (WHERE COALESCE(payment_status,'Pending')='Pending'
                          AND EXISTS (SELECT 1 FROM public.employee_deductions d
                                      WHERE d.nhe_sale_id = nhe_sales.id AND d.status='deducted'))::int AS pending_but_already_deducted,
       count(*) FILTER (WHERE COALESCE(amount_received,0) > amount)::int AS received_more_than_billed
FROM public.nhe_sales;

-- [5] THE LINE SIDE, and the imprest coverage. Line entry is built but must not
-- have touched daily_records, and every cash row should have a holder.
SELECT (SELECT count(*)::int FROM public.line_production) AS line_egg_rows,
       (SELECT count(*)::int FROM public.line_mortality) AS line_mortality_rows,
       (SELECT count(*)::int FROM public.line_placements) AS line_placements,
       (SELECT count(*)::int FROM public.v_imprest_entries
        WHERE cash_account_id IS NULL AND COALESCE(payment_mode,'cash')='cash') AS cash_rows_with_no_imprest,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid='public.daily_records'::regclass AND NOT tgisinternal
          AND tgenabled::text='O') AS daily_record_triggers_enabled;

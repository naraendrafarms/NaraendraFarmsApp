-- Migration 394: close out the remaining important audit-log gaps.
-- Covered so far (170/366/393): daily_records, flocks, nhe_sales, he_dispatch,
-- salary_monthly, attendance_daily, grn, cash_book, employees, farm_expenses,
-- flock_transfers, electricity_bills, purchase_orders, party_advances,
-- employee_advances, vhl_* (5 tables), bag_sales, daily_feed, feed_production,
-- medicine_usage, medicine_purchases, hatch_batches, bonus, pending_payments,
-- partners, statutory_liabilities, generator_diesel_purchases,
-- generator_maintenance_log, vaccination_records, supplier_invoices,
-- feed_transfers, egg_conversions, egg_opening_stock, shed_transfers.
--
-- Still missing, and genuinely worth an audit trail (money movement /
-- vendor master / other real transactional edits) — master/lookup-only
-- tables (config_options, units_master, feed_types, items, etc.) are
-- intentionally skipped, same as before.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'bank_transactions', 'parties', 'employee_deductions', 'generators',
    'generator_usage_log', 'feedmill_expenses', 'po_receipts',
    'hatchery_advances', 'vendor_bank_details', 'company_settings'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()', t
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END;
$$;

SELECT event_object_table, count(*) AS trigger_events
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit'
  AND event_object_table IN (
    'bank_transactions', 'parties', 'employee_deductions', 'generators',
    'generator_usage_log', 'feedmill_expenses', 'po_receipts',
    'hatchery_advances', 'vendor_bank_details', 'company_settings'
  )
GROUP BY event_object_table ORDER BY event_object_table;

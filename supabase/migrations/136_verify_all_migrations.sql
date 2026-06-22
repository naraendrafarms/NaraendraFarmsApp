-- Migration 136: Verify all schema elements from migrations 001–135
-- Each SELECT returns a row per checked item with EXISTS result.
-- run_sql.py will print the rows so we can confirm in the job log.

SELECT
  -- Core tables (001)
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='farms')               AS t_farms,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flocks')              AS t_flocks,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_records')       AS t_daily_records,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='he_dispatch')         AS t_he_dispatch,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nhe_sales')           AS t_nhe_sales,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='grn')                 AS t_grn,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')           AS t_employees,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='salary_monthly')      AS t_salary_monthly,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pending_payments')    AS t_pending_payments,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_orders')     AS t_purchase_orders;

SELECT
  -- Tables from mid migrations
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_feed')           AS t_daily_feed,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bank_accounts')        AS t_bank_accounts,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bank_transactions')    AS t_bank_transactions,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='electricity_bills')    AS t_electricity_bills,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='electricity_allocation') AS t_elec_alloc,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cash_book')            AS t_cash_book,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_log')            AS t_audit_log,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_invoices')    AS t_supplier_invoices,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='farm_expenses')        AS t_farm_expenses,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='medicine_usage')       AS t_medicine_usage;

SELECT
  -- Tables from later migrations
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='hatch_batches')        AS t_hatch_batches,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='egg_conversions')      AS t_egg_conversions,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='po_receipts')          AS t_po_receipts,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feed_production_log')  AS t_feed_production_log,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='salary_abstract')      AS t_salary_abstract,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vaccination_records')  AS t_vaccination_records,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attendance_daily')     AS t_attendance_daily,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_advances')    AS t_employee_advances,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nhe_sale_lines')       AS t_nhe_sale_lines,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flock_sheds')          AS t_flock_sheds;

SELECT
  -- Tables from 100+ migrations
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gst_transactions')     AS t_gst_transactions,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoice_series')       AS t_invoice_series,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parties')              AS t_parties,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cms_uploads')          AS t_cms_uploads,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cash_book_opening')    AS t_cash_book_opening,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_deductions')  AS t_employee_deductions,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='medicines_master')     AS t_medicines_master,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='hatcheries')           AS t_hatcheries,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feed_stock_adjustments') AS t_feed_stock_adj,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventory_items')      AS t_inventory_items;

SELECT
  -- Key columns added by specific migrations
  -- 013: salary ESI/PF
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='esi_applicable')       AS c_emp_esi,
  -- 021: employee extra fields
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='department')           AS c_emp_dept,
  -- 024: pending_payments extra
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='utr_no')        AS c_pp_utr,
  -- 060: daily_records split trcull
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_records' AND column_name='transfer_female')  AS c_dr_transfer_f,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_records' AND column_name='cull_female')      AS c_dr_cull_f,
  -- 082: cash_book source ids
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_book' AND column_name='nhe_sale_id')          AS c_cb_nhe_sale_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_book' AND column_name='he_dispatch_id')       AS c_cb_he_dispatch_id,
  -- 090: grn gst
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='grn' AND column_name='gst_amount')                AS c_grn_gst,
  -- 107/108: he_dispatch tds
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='he_dispatch' AND column_name='tds_pct')            AS c_hed_tds_pct,
  -- 112: vehicle type
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='he_dispatch' AND column_name='vehicle_type')       AS c_hed_vehicle_type;

SELECT
  -- 113: grn unification
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='grn' AND column_name='category')                  AS c_grn_category,
  -- 116: parties tds default
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parties' AND column_name='tds_pct')               AS c_parties_tds,
  -- 117: nhe_sale_lines
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nhe_sale_lines')                                    AS t_nhe_sale_lines2,
  -- 124: employee_deductions
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_deductions')                              AS t_emp_deductions2,
  -- 125: cms_uploads
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cms_uploads')                                      AS t_cms_uploads2,
  -- 132: flock_sheds
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flock_sheds')                                      AS t_flock_sheds2,
  -- 133: pending_payments discount + party_id + purchase_orders.payment_status
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='discount_amount') AS c_pp_discount,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='party_id')      AS c_pp_party_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='payment_status') AS c_po_pay_status,
  -- 134: purchase improvements
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='basic_amount')  AS c_pp_basic_amount;

SELECT
  -- 134 cont + 135
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='gst_pct')       AS c_pp_gst_pct,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='category')      AS c_pp_category,
  -- 135: cash_book_opening + unique indexes
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cash_book_opening')                                 AS t_cb_opening2,
  EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_cash_book_nhe_sale_id')                                           AS idx_cb_nhe,
  EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_cash_book_he_dispatch_id')                                        AS idx_cb_he,
  -- parties bank details (093 era)
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parties' AND column_name='bank_name')              AS c_parties_bank,
  -- employees leaving_date
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='leaving_date')         AS c_emp_leaving_date,
  -- grn supplier_invoice_id (115)
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='grn' AND column_name='supplier_invoice_id')        AS c_grn_sup_inv,
  -- v_flock_summary view
  EXISTS(SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_flock_summary')                                    AS v_flock_summary,
  -- fn_grn_to_payment trigger function
  EXISTS(SELECT 1 FROM pg_proc WHERE proname='fn_grn_to_payment' AND pronamespace='public'::regnamespace)                                       AS fn_grn_to_payment;

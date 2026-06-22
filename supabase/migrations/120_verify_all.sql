-- Verify all migrations from this session
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='parties' AND column_name='tds_pct_default') AS col_116_tds_default,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='nhe_sale_lines') AS tbl_117_nhe_lines,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='nhe_sales' AND constraint_name='nhe_sales_unique') AS con_118_old_constraint_exists,
  (SELECT COUNT(*) FROM public.bank_accounts WHERE bank_name IN ('Kotak Mahindra Bank','Dendi Naraendra Reddy')) AS cnt_119_bank_accounts,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='supplier_invoices' AND column_name='grn_id') AS col_115_grn_id,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='grn' AND column_name='category') AS col_113_grn_category;

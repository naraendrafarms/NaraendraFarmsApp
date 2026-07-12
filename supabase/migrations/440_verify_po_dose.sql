SELECT count(*) AS po_dose_added FROM information_schema.columns
WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='dose';

INSERT INTO purchase_orders (po_no, fiscal_year, vendor_name, dose) VALUES ('TEST-DIAG-DOSE', '26-27', 'Test Vendor', '1000');
SELECT count(*) AS test_row_exists FROM purchase_orders WHERE po_no = 'TEST-DIAG-DOSE' AND dose = '1000';
DELETE FROM purchase_orders WHERE po_no = 'TEST-DIAG-DOSE';

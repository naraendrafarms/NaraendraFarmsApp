-- Migration 163: Add missing is_active column to config_options, then re-seed
-- All migrations 151/155/156/158/162 silently failed because is_active column did not exist.
-- run_sql.py swallows "does not exist" errors → reported Errors: 0 every time.

ALTER TABLE public.config_options ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Re-seed everything that failed. ON CONFLICT updates label/sort_order so existing rows are fixed too.

INSERT INTO public.config_options (grp, value, label, sort_order, is_active) VALUES

-- Item Categories (for Items Master)
  ('item_category', 'Feed Ingredient', 'Feed Ingredient',  1, TRUE),
  ('item_category', 'Medicine',        'Medicine',          2, TRUE),
  ('item_category', 'Vaccine',         'Vaccine',           3, TRUE),
  ('item_category', 'Supplement',      'Supplement',        4, TRUE),
  ('item_category', 'Injectable',      'Injectable',        5, TRUE),
  ('item_category', 'Sanitizer',       'Sanitizer',         6, TRUE),
  ('item_category', 'Disinfectant',    'Disinfectant',      7, TRUE),
  ('item_category', 'Pesticide',       'Pesticide',         8, TRUE),
  ('item_category', 'Packaging',       'Packaging',         9, TRUE),
  ('item_category', 'Equipment',       'Equipment',        10, TRUE),
  ('item_category', 'Spares',          'Spares',           11, TRUE),
  ('item_category', 'Chemical',        'Chemical',         12, TRUE),
  ('item_category', 'Chicks',          'Chicks',           13, TRUE),
  ('item_category', 'Other',           'Other',            14, TRUE),

-- Units of Measure
  ('unit', 'kg',      'kg',       1, TRUE),
  ('unit', 'g',       'g',        2, TRUE),
  ('unit', 'MT',      'MT',       3, TRUE),
  ('unit', 'Quintal', 'Quintal',  4, TRUE),
  ('unit', 'Ltr',     'Ltr',      5, TRUE),
  ('unit', 'ML',      'ML',       6, TRUE),
  ('unit', 'Gms',     'Gms',      7, TRUE),
  ('unit', 'Dose',    'Dose',     8, TRUE),
  ('unit', 'Nos',     'Nos',      9, TRUE),
  ('unit', 'Box',     'Box',     10, TRUE),
  ('unit', 'Bag',     'Bag',     11, TRUE),
  ('unit', 'Vial',    'Vial',    12, TRUE),
  ('unit', 'Tablet',  'Tablet',  13, TRUE),
  ('unit', 'Sachet',  'Sachet',  14, TRUE),
  ('unit', 'Strip',   'Strip',   15, TRUE),
  ('unit', 'Bottle',  'Bottle',  16, TRUE),
  ('unit', 'Roll',    'Roll',    17, TRUE),
  ('unit', 'Mtrs',    'Mtrs',    18, TRUE),
  ('unit', 'Pair',    'Pair',    19, TRUE),
  ('unit', 'Set',     'Set',     20, TRUE),

-- Medicine Sub-Types
  ('medicine_subtype', 'tablet',    'Tablet',    1, TRUE),
  ('medicine_subtype', 'liquid',    'Liquid',    2, TRUE),
  ('medicine_subtype', 'powder',    'Powder',    3, TRUE),
  ('medicine_subtype', 'vial',      'Vial',      4, TRUE),
  ('medicine_subtype', 'injection', 'Injection', 5, TRUE),
  ('medicine_subtype', 'sachet',    'Sachet',    6, TRUE),
  ('medicine_subtype', 'spray',     'Spray',     7, TRUE),
  ('medicine_subtype', 'other',     'Other',     8, TRUE),

-- GST Rates
  ('gst_rate', '0',   '0%',   1, TRUE),
  ('gst_rate', '5',   '5%',   2, TRUE),
  ('gst_rate', '12',  '12%',  3, TRUE),
  ('gst_rate', '18',  '18%',  4, TRUE),
  ('gst_rate', '28',  '28%',  5, TRUE),

-- GST Supplier Type
  ('gst_supplier_type', 'registered',   'Registered',         1, TRUE),
  ('gst_supplier_type', 'unregistered', 'Unregistered',       2, TRUE),
  ('gst_supplier_type', 'composition',  'Composition Dealer', 3, TRUE),

-- Purchase Nature
  ('purchase_nature', 'purchase', 'Purchase',      1, TRUE),
  ('purchase_nature', 'expense',  'Expense',        2, TRUE),
  ('purchase_nature', 'asset',    'Capital Asset',  3, TRUE),

-- Payment Status
  ('payment_status', 'Pending', 'Pending', 1, TRUE),
  ('payment_status', 'Paid',    'Paid',    2, TRUE),
  ('payment_status', 'HOLD',    'HOLD',    3, TRUE),

-- Stock Adjustment Types
  ('adjustment_type', 'Opening Stock', 'Opening Stock',  1, TRUE),
  ('adjustment_type', 'Wastage',       'Wastage',        2, TRUE),
  ('adjustment_type', 'Damage',        'Damage',         3, TRUE),
  ('adjustment_type', 'Correction',    'Correction',     4, TRUE),
  ('adjustment_type', 'Found',         'Found (Excess)', 5, TRUE),
  ('adjustment_type', 'Transfer Out',  'Transfer Out',   6, TRUE),
  ('adjustment_type', 'Transfer In',   'Transfer In',    7, TRUE),

-- Feed Mill Adjustment Types
  ('feedmill_adjustment', 'Opening',     'Opening Balance', 1, TRUE),
  ('feedmill_adjustment', 'Addition',    'Addition',        2, TRUE),
  ('feedmill_adjustment', 'Write-off',   'Write-off',       3, TRUE),
  ('feedmill_adjustment', 'Transfer Out','Transfer Out',    4, TRUE),
  ('feedmill_adjustment', 'Transfer In', 'Transfer In',     5, TRUE),
  ('feedmill_adjustment', 'Correction',  'Correction',      6, TRUE),

-- Vaccine / Medicine Route
  ('vaccine_route', 'drinking_water', 'Drinking Water',  1, TRUE),
  ('vaccine_route', 'eye_drop',       'Eye Drop',        2, TRUE),
  ('vaccine_route', 'injection',      'Injection',       3, TRUE),
  ('vaccine_route', 'spray',          'Spray',           4, TRUE),
  ('vaccine_route', 'wing_web',       'Wing Web',        5, TRUE),
  ('vaccine_route', 'subcutaneous',   'Sub-cutaneous',   6, TRUE),
  ('vaccine_route', 'intramuscular',  'Intra-muscular',  7, TRUE),
  ('vaccine_route', 'intraocular',    'Intra-ocular',    8, TRUE),

-- Egg Grade Types
  ('egg_type', 'he_grade_a', 'HE Grade A', 1, TRUE),
  ('egg_type', 'he_grade_b', 'HE Grade B', 2, TRUE),
  ('egg_type', 'he_grade_c', 'HE Grade C', 3, TRUE),
  ('egg_type', 'je_eggs',    'JE Eggs',    4, TRUE),
  ('egg_type', 'te_eggs',    'TE Eggs',    5, TRUE),
  ('egg_type', 'be_eggs',    'BE Eggs',    6, TRUE),
  ('egg_type', 'le_eggs',    'LE Eggs',    7, TRUE),

-- Attendance Status
  ('attendance_status', 'P',  'Present',         1, TRUE),
  ('attendance_status', 'A',  'Absent',          2, TRUE),
  ('attendance_status', 'H',  'Half Day',        3, TRUE),
  ('attendance_status', 'WO', 'Week Off',        4, TRUE),
  ('attendance_status', 'OT', 'Overtime (Full)', 5, TRUE),

-- Advance Types
  ('advance_type', 'salary_advance', 'Salary Advance', 1, TRUE),
  ('advance_type', 'loan',           'Loan',           2, TRUE),
  ('advance_type', 'medical',        'Medical',        3, TRUE),
  ('advance_type', 'other',          'Other',          4, TRUE),

-- TXN Types (Cash Book)
  ('txn_type', 'credit', 'Credit (In)',  1, TRUE),
  ('txn_type', 'debit',  'Debit (Out)',  2, TRUE),

-- Cash Book Categories
  ('cashbook_category', 'je_sale',          'JE Sale',              1, TRUE),
  ('cashbook_category', 'te_sale',          'TE Sale',              2, TRUE),
  ('cashbook_category', 'he_sale',          'HE Sale',              3, TRUE),
  ('cashbook_category', 'be_sale',          'BE Sale',              4, TRUE),
  ('cashbook_category', 'bird_sale',        'Bird Sale',            5, TRUE),
  ('cashbook_category', 'litter_sale',      'Litter / Manure Sale', 6, TRUE),
  ('cashbook_category', 'purchase_payment', 'Purchase Payment',     7, TRUE),
  ('cashbook_category', 'salary',           'Salary',               8, TRUE),
  ('cashbook_category', 'advance',          'Advance',              9, TRUE),
  ('cashbook_category', 'electricity',      'Electricity',         10, TRUE),
  ('cashbook_category', 'transfer',         'Bank Transfer',       11, TRUE),
  ('cashbook_category', 'expense',          'Farm Expense',        12, TRUE),
  ('cashbook_category', 'other',            'Other',               13, TRUE),

-- Invoice Source Types
  ('invoice_source', 'chick',       'Chick Purchase', 1, TRUE),
  ('invoice_source', 'grn',         'GRN / Material', 2, TRUE),
  ('invoice_source', 'medicine',    'Medicine',       3, TRUE),
  ('invoice_source', 'electricity', 'Electricity',    4, TRUE),
  ('invoice_source', 'labour',      'Labour',         5, TRUE),
  ('invoice_source', 'other',       'Other',          6, TRUE),

-- Material Status (PO/GRN)
  ('material_status', 'Pending',   'Pending',   1, TRUE),
  ('material_status', 'Received',  'Received',  2, TRUE),
  ('material_status', 'Partial',   'Partial',   3, TRUE),
  ('material_status', 'Cancelled', 'Cancelled', 4, TRUE),

-- Expense Payment Mode
  ('expense_payment_mode', 'cash',   'Cash',   1, TRUE),
  ('expense_payment_mode', 'bank',   'Bank',   2, TRUE),
  ('expense_payment_mode', 'credit', 'Credit', 3, TRUE),

-- Payment Methods
  ('payment_method', 'cash',   'Cash',   1, TRUE),
  ('payment_method', 'upi',    'UPI',    2, TRUE),
  ('payment_method', 'cheque', 'Cheque', 3, TRUE),
  ('payment_method', 'neft',   'NEFT',   4, TRUE),
  ('payment_method', 'rtgs',   'RTGS',   5, TRUE),
  ('payment_method', 'imps',   'IMPS',   6, TRUE),
  ('payment_method', 'online', 'Online', 7, TRUE),
  ('payment_method', 'bank',   'Bank',   8, TRUE)

ON CONFLICT (grp, value) DO UPDATE
  SET label      = EXCLUDED.label,
      sort_order = EXCLUDED.sort_order,
      is_active  = EXCLUDED.is_active;

-- Verify
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.config_options WHERE is_active = TRUE;
  RAISE NOTICE 'config_options active rows: %', cnt;
END;
$$;

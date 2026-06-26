-- Migration 158: Add payment_method config group
INSERT INTO public.config_options (grp, value, label, sort_order, is_active)
VALUES
  ('payment_method', 'cash',   'Cash',          1, TRUE),
  ('payment_method', 'upi',    'UPI',           2, TRUE),
  ('payment_method', 'cheque', 'Cheque',        3, TRUE),
  ('payment_method', 'neft',   'NEFT',          4, TRUE),
  ('payment_method', 'rtgs',   'RTGS',          5, TRUE),
  ('payment_method', 'imps',   'IMPS',          6, TRUE),
  ('payment_method', 'online', 'Online',        7, TRUE),
  ('payment_method', 'bank',   'Bank Transfer', 8, TRUE)
ON CONFLICT (grp, value) DO NOTHING;

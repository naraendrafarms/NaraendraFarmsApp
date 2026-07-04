-- Migration 349: company_settings unexpectedly reported 22 rows after migration 348 — investigate
SELECT id, company_name, address_line1, updated_at FROM public.company_settings ORDER BY updated_at;

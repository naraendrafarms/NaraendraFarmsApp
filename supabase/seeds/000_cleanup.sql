-- ============================================================
-- COMPLETE CLEAN RESET — drops all data and rebuilds
-- ============================================================

-- Drop everything in correct dependency order
DROP TABLE IF EXISTS public.salary_abstract CASCADE;
DROP TABLE IF EXISTS public.salary_monthly CASCADE;
DROP TABLE IF EXISTS public.bonus CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.electricity_allocation CASCADE;
DROP TABLE IF EXISTS public.electricity_bills CASCADE;
DROP TABLE IF EXISTS public.electricity_meters CASCADE;
DROP TABLE IF EXISTS public.medicine_monthly CASCADE;
DROP TABLE IF EXISTS public.medicine_usage CASCADE;
DROP TABLE IF EXISTS public.medicines_master CASCADE;
DROP TABLE IF EXISTS public.nhe_sales CASCADE;
DROP TABLE IF EXISTS public.he_dispatch CASCADE;
DROP TABLE IF EXISTS public.hatchability CASCADE;
DROP TABLE IF EXISTS public.daily_records CASCADE;
DROP TABLE IF EXISTS public.ingredient_stock CASCADE;
DROP TABLE IF EXISTS public.feed_transfers CASCADE;
DROP TABLE IF EXISTS public.feed_production_ingredients CASCADE;
DROP TABLE IF EXISTS public.feed_production CASCADE;
DROP TABLE IF EXISTS public.grn CASCADE;
DROP TABLE IF EXISTS public.feed_formulas CASCADE;
DROP TABLE IF EXISTS public.feed_types CASCADE;
DROP TABLE IF EXISTS public.feed_ingredients CASCADE;
DROP TABLE IF EXISTS public.flocks CASCADE;
DROP TABLE IF EXISTS public.sheds CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.hatcheries CASCADE;
DROP TABLE IF EXISTS public.farms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.v_monthly_production CASCADE;
DROP VIEW IF EXISTS public.v_hatchability_summary CASCADE;

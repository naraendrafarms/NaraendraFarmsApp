-- The store keeper must not see PO prices. Goods receipt lives inside the
-- 'purchase' module, so giving them GRN meant giving them Purchase Orders,
-- Intent and Pending Payments as well. GRN gets its own module key, the way
-- line_master was split out of masters in migration 1127.
--
-- MIGRATION FIRST, CODE AFTER. The frontend does not know the key 'grn' yet.
-- That order is not optional: role_permissions fails CLOSED, so shipping the
-- code first would hide GRN from EVERY role - including accounts and the site
-- managers using it today - until these rows existed.
--
-- NOBODY GAINS OR LOSES ANYTHING, except the store keeper as instructed:
-- every role's new 'grn' level is COPIED from its existing 'purchase' level,
-- so whoever can receive goods today still can, at the same level.

-- 1. Copy each role's purchase level onto grn. ON CONFLICT DO NOTHING so a
--    re-run can never overwrite a level an admin has since set by hand.
INSERT INTO public.role_permissions (role, module_key, level)
SELECT role, 'grn', level
  FROM public.role_permissions
 WHERE module_key = 'purchase'
ON CONFLICT (role, module_key) DO NOTHING;

-- 2. Now close purchase for the store keeper. They keep grn at the level just
--    copied ('full'), and lose Purchase Orders, Intent and Pending Payments.
--    This UPDATEs a live row, so the rows are COPIED FIRST, before the write.
CREATE TABLE IF NOT EXISTS public.role_permissions_backup_1351 AS
SELECT * FROM public.role_permissions
 WHERE role = 'store_keeper' AND module_key IN ('purchase', 'grn');

UPDATE public.role_permissions
   SET level = 'hidden'
 WHERE role = 'store_keeper' AND module_key = 'purchase' AND level <> 'hidden';

-- 3. Verify: every role's purchase vs grn, so any drift is visible at a glance.
SELECT string_agg(line, ' | ' ORDER BY role) AS purchase_vs_grn
FROM (
  SELECT p.role, p.role || ': purchase=' || p.level || ' grn=' || COALESCE(g.level, 'MISSING') AS line
    FROM public.role_permissions p
    LEFT JOIN public.role_permissions g ON g.role = p.role AND g.module_key = 'grn'
   WHERE p.module_key = 'purchase'
) s;

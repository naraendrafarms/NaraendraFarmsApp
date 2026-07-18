SELECT count(*) AS total_rows FROM public.role_permissions;
SELECT role, count(*) AS modules FROM public.role_permissions GROUP BY role ORDER BY role;
SELECT string_agg(module_key || ':' || level, ' | ' ORDER BY module_key) AS site_incharge_perms
FROM public.role_permissions WHERE role = 'site_incharge';

-- Migration 357: get farm names for flock 21's laying_farm_id / rearing_farm_id
SELECT id, name, code, type, is_active FROM public.farms
WHERE id IN ('a7883f96-fc7b-4e9b-80fd-25d45e9b1799', '62909634-e044-4232-bda7-7302b3a15f26');

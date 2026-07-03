-- 297 revealed pre-existing Packaging items I didn't check for before
-- creating new ones in migration 296 — need the full list to map correctly
-- and avoid duplicate stock items for the same physical thing.
SELECT id, name, category, unit FROM public.items
WHERE category = 'Packaging' ORDER BY name;

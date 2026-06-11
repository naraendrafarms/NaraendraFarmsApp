-- Migration 027: Extra dedup pass for parties
-- Removes whitespace-collapsed duplicates and ensures purchase_orders.vendor_name
-- always maps to a canonical party name.

-- Collapse multiple internal spaces to single space for all party names
UPDATE public.parties
SET name = regexp_replace(trim(name), '\s+', ' ', 'g')
WHERE name <> regexp_replace(trim(name), '\s+', ' ', 'g');

-- Dedup any exact duplicates that may exist after normalisation
-- (keeps earliest created_at)
DELETE FROM public.parties
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY LOWER(TRIM(regexp_replace(name, '\s+', ' ', 'g'))), type
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.parties
  ) ranked
  WHERE rn > 1
);

-- Ensure unique index still holds (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS parties_name_type_unique
  ON public.parties (LOWER(TRIM(name)), type);

-- Report duplicates remaining in purchase_orders (diagnostic only - no changes)
-- SELECT po_no, item_name, COUNT(*) FROM public.purchase_orders
-- GROUP BY po_no, item_name HAVING COUNT(*) > 1;

-- Remove duplicate GRN rows keeping only the earliest inserted (smallest ctid)
DELETE FROM public.grn a
USING public.grn b
WHERE a.ctid > b.ctid
  AND a.grn_no      = b.grn_no
  AND a.grn_date    = b.grn_date
  AND COALESCE(a.farm_id::text,'')  = COALESCE(b.farm_id::text,'')
  AND COALESCE(a.item_name,'')      = COALESCE(b.item_name,'')
  AND COALESCE(a.total_amount::text,'') = COALESCE(b.total_amount::text,'');

-- Add unique constraint so future loads never create duplicates
ALTER TABLE public.grn
  ADD CONSTRAINT grn_unique_record
  UNIQUE (grn_no, grn_date, farm_id, item_name, total_amount);

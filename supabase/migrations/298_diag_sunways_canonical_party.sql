-- Confirmed real merge duplicates: GRN 2667 and 2699, both
-- "Sunways Bio Science LLP" (party e8a0e918-a17c-4857-923b-451b3811409d)
-- vs "Sunways Bio-Science LLP" (party 02fb5d92-b29f-415c-a387-1991b94af6ba).
-- Check which of the two party records still exists (the merge should have
-- deleted one) to know the canonical post-merge name.
SELECT id, name FROM public.parties
WHERE id IN ('e8a0e918-a17c-4857-923b-451b3811409d', '02fb5d92-b29f-415c-a387-1991b94af6ba');

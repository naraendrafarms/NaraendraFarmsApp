-- 307 only found ONE Sachin party (90e39bd8, "...Proteins...", active,
-- type=supplier) via ILIKE search — but pending_payments still has 3 bills
-- under party_id 02068ea5 ("...Protiens..." typo). That party_id doesn't
-- match '%sachin%' anymore, meaning it was likely already DELETED from
-- parties (pending_payments.party_id has no real FK constraint, so it can
-- point to a since-deleted id) — this would make it a MERGE LEFTOVER like
-- Sunways, not a live unmerged duplicate as first assumed. Confirm directly.
SELECT id, name FROM public.parties WHERE id = '02068ea5-d363-4fe1-ba4c-c7631877729b';

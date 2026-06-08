-- Migration 020: No-op. Original DELETE replaced because:
-- Seeds already use ON CONFLICT DO UPDATE SET opening_female = EXCLUDED.opening_female,
-- and hd_pct is GENERATED ALWAYS AS (total_eggs/opening_female), so it auto-corrects.
-- Deleting on every deploy caused F19/F20 birds to show 0 during the seed re-insert window.
SELECT 1;

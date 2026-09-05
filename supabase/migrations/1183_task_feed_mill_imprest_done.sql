-- Migration 1183: the Feed Mill half of the "belongs to no imprest" task is
-- done. Head Office is not, so the task stays OPEN with its scope narrowed
-- rather than being closed on half the work.

UPDATE public.tasks
SET title = 'Head Office expenses belong to no imprest - 134 rows, Rs 3,70,856',
    description = description || E'\n\nFEED MILL DONE 05/09/2026 (migration 1182). "Feed Mill Site Imprest" was created against the Feed Mill farm as a site_petty account, named and shaped like the imprests migration 1155 created, so the 1159 derivation picks it up with no code change. It took 9 entries immediately: Rs 42,818 received and Rs 10,139 paid out, opening at Rs 32,679 -- POSITIVE, not the negative figure expected, because the Feed Mill receives cash as well as spending it. No opening balance was invented; like every other account it starts at zero, so that figure is only what has been recorded since, not what the tin holds. The owner sets the real opening on Masters -> Cash Imprest Accounts.'
      || E'\n\nHEAD OFFICE STILL OPEN - WAITING ON YOU. 134 entries worth about Rs 3,70,856 remain unassigned (141 rows in total across all sources, Rs 3,79,931 net out). It was deliberately not given an imprest: Head Office cash could sit with HO Imprest, with Mandal, or with a named person, and choosing one without being told would put a false balance on a real person''s account. Two ways to settle it: (a) give the Head Office farm its own site imprest, exactly as the Feed Mill just got, or (b) change rule 3 of the 1159 derivation so a site with no imprest of its own falls back to HO Imprest instead of requiring farm_id to be NULL. Option (b) is one line and needs no new cash box for anyone to hold.',
    priority = 'normal'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title LIKE 'Head Office and Feed Mill expenses belong to no imprest%';

-- VERIFY: the task was renarrowed rather than closed, and the account is live.
SELECT (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development'
          AND title = 'Head Office expenses belong to no imprest - 134 rows, Rs 3,70,856'
          AND COALESCE(status,'pending') <> 'done') AS task_renarrowed_and_open,
       (SELECT count(*)::int FROM public.cash_accounts a JOIN public.farms f ON f.id = a.farm_id
        WHERE COALESCE(f.site_type,'') = 'feedmill') AS feed_mill_imprest,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') AS open_total;

-- Migration 743: record the paging fault and what is left of it.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, v.status, v.priority
FROM (VALUES
  ('Unstable paging could drop rows silently — fixed 18/08/2026',
   'DONE 18/08/2026. Alkakarb''s 5,000 kg GRN of 11/06/2026 was on the ledger, linked, with the right category, and Feed Stock Status still showed Total In 2,175 and balance -879 — having shown it correctly the day before. Cause: pages read big tables in 1,000-row slices sorted by a NON-UNIQUE column (txn_date, record_date, grn_date, item_name). Rows sharing that value have no defined order, so page 2 can be arranged differently from page 1 and a row falls in the gap between them: never returned, no error, and a different row each time the query runs. That is why a figure can be right one day and wrong the next with nothing changed in the data. All 79 such reads were found by sweeping the code; 71 now sort by their id as well, which is unique. The 3 left read database views that have no id column, and 5 were already stable. Anything paged in future must carry a unique tie-breaker.',
   'Housekeeping', 'done', 'high'),
  ('3 paged views have no unique sort key',
   'OPEN, low risk: v_party_ledger, v_po_grn_rate (twice) are read in pages but sorted by date alone, and being views they have no id to break ties. They are small today. Fix by giving each view a stable ordering column, or by reading the underlying tables.',
   'Housekeeping', 'pending', 'low')
) AS v(title, description, team, status, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

UPDATE public.tasks SET completed_at = now()
WHERE task_type = 'development' AND status = 'done' AND completed_at IS NULL;

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';

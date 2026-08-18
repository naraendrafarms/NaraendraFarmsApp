-- Migration 753: what the totals sweep left, so the rest is on the list rather
-- than in a message.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Quantity totals: 12 tables still without one',
   'OPEN. Every table in the app was swept on 18/08/2026: 44 carry a quantity column, 30 had no total at all, and the ones where a total is meaningful now have one. These are the rest, left deliberately or left for later. NOT MEANINGFUL, so deliberately left: the two medicine usage lists (flock medicine allocations, VHL medicine) — they mix ml, doses and grams across different medicines, so one figure would be nonsense and per-unit is barely better; Operations Board per-flock cards, which are not a list; the Masters shed list. WORTH DOING, not yet done: the flock Daily Records grid (eggs, feed, mortality down the columns); the flock HE Dispatch tab (boxes, total birds); the flock Feed tab (kg and cost); the flock Hatch Batches tab (eggs set, hatched); the PO register (qty per unit, amount); the electricity meter-wise list (units, amount); the Operations Board site table; the hatchability detail table with 22 columns. Each is a small edit of the same shape as the ones already done.',
   'Housekeeping', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';

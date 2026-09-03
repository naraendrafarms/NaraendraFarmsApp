-- Migration 1167: read-only. The 44 open development tasks, titles only.
--
-- 1166 printed the list as one string and the runner cut it off after two
-- entries. Titles alone, in five short batches, fit in the log. Nothing is
-- written; nothing is closed.

SELECT string_agg(t.txt, ' | ' ORDER BY t.rn) AS batch_1
FROM (SELECT rn, rn || '. ' || title AS txt FROM (
  SELECT row_number() OVER (ORDER BY created_at, id) AS rn, title
  FROM public.tasks WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') q
  WHERE rn BETWEEN 1 AND 9) t;

SELECT string_agg(t.txt, ' | ' ORDER BY t.rn) AS batch_2
FROM (SELECT rn, rn || '. ' || title AS txt FROM (
  SELECT row_number() OVER (ORDER BY created_at, id) AS rn, title
  FROM public.tasks WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') q
  WHERE rn BETWEEN 10 AND 18) t;

SELECT string_agg(t.txt, ' | ' ORDER BY t.rn) AS batch_3
FROM (SELECT rn, rn || '. ' || title AS txt FROM (
  SELECT row_number() OVER (ORDER BY created_at, id) AS rn, title
  FROM public.tasks WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') q
  WHERE rn BETWEEN 19 AND 27) t;

SELECT string_agg(t.txt, ' | ' ORDER BY t.rn) AS batch_4
FROM (SELECT rn, rn || '. ' || title AS txt FROM (
  SELECT row_number() OVER (ORDER BY created_at, id) AS rn, title
  FROM public.tasks WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') q
  WHERE rn BETWEEN 28 AND 36) t;

SELECT string_agg(t.txt, ' | ' ORDER BY t.rn) AS batch_5
FROM (SELECT rn, rn || '. ' || title AS txt FROM (
  SELECT row_number() OVER (ORDER BY created_at, id) AS rn, title
  FROM public.tasks WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') q
  WHERE rn BETWEEN 37 AND 60) t;

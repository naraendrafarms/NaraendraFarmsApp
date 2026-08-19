-- Migration 790: the two development tasks I closed earlier today were marked
-- done with a plain status update, so they carry no completion date. The app
-- records one when a person ticks a task off, and a migration should do the
-- same rather than leaving the list unable to say when anything finished.
--
-- Only today's two are touched. Older done tasks keep a NULL completion date,
-- and the page now says "not recorded" for those rather than inventing one.

UPDATE public.tasks
   SET completed_at = now()
 WHERE task_type = 'development'
   AND status = 'done'
   AND completed_at IS NULL
   AND title IN (
     'Usage panel on the Health Check page',
     'From-To date range for Attendance, Salary and Electricity'
   );

SELECT 'dates' AS chk,
       count(*) FILTER (WHERE status = 'done' AND completed_at IS NOT NULL) AS done_with_date,
       count(*) FILTER (WHERE status = 'done' AND completed_at IS NULL) AS done_without_date,
       count(*) FILTER (WHERE created_at IS NULL) AS missing_created
FROM public.tasks WHERE task_type = 'development';

-- Popup task-assignment alerts (TaskAlerts.tsx) subscribe to Supabase
-- Realtime postgres_changes on public.tasks. Realtime only fires for tables
-- explicitly added to the supabase_realtime publication (confirmed via
-- migration 249_chat.sql doing the same for chat_messages) — without this,
-- the subscription in the app would silently never receive events.
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

SELECT 'sentinel' AS marker, 1 AS n;
SELECT count(*) AS in_publication FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks';

-- Diagnostic only (SELECT), no data changes.
-- (A) Flock 22's Solucal/Famitone medicine_usage rows — are they still
--     showing their OLD stored rate/amount (frozen at save time), which my
--     earlier fix never retroactively corrected?
SELECT mu.id, mu.usage_date, mm.name, mu.quantity, mu.rate, mu.amount
FROM public.medicine_usage mu
JOIN public.medicines_master mm ON mm.id = mu.medicine_id
JOIN public.flocks f ON f.id = mu.flock_id
WHERE f.flock_no = '22' AND mm.name IN ('Solucal','Famitone')
ORDER BY mu.usage_date DESC;

-- (B) Chat realtime plumbing: publication membership + replica identity
SELECT 'realtime_pub' AS chk, count(*) FROM pg_publication_tables
WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages';

SELECT 'replica_identity' AS chk, relreplident FROM pg_class
WHERE relname='chat_messages' AND relnamespace = 'public'::regnamespace;

-- (C) Current RLS policies on all 3 chat tables (name + command + using/check)
SELECT 'policy' AS chk, tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE tablename IN ('chat_groups','chat_group_members','chat_messages')
ORDER BY tablename, policyname;

-- (D) Any messages actually landed recently? (sanity check sends are working)
SELECT 'recent_messages' AS chk, count(*) FROM public.chat_messages WHERE created_at > now() - interval '2 hours';

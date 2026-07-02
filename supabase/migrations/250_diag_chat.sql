SELECT 'tables' AS chk, count(*) FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('chat_groups','chat_group_members','chat_messages');
SELECT 'bucket' AS chk, count(*) FROM storage.buckets WHERE id='chat-attachments';
SELECT 'policies' AS chk, count(*) FROM pg_policies WHERE tablename IN ('chat_groups','chat_group_members','chat_messages');

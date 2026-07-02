-- Fix "new row violates row-level security policy for table chat_groups":
-- the app inserts a chat_groups row THEN inserts the creator into
-- chat_group_members. Supabase's insert().select() needs the new row to be
-- visible under the SELECT policy immediately after insert — but at that
-- point the creator isn't a member yet (that happens in a second query), so
-- is_chat_member(id) was false and RLS blocked returning the new row.
-- Fix: let the creator see their own just-created group even before the
-- membership row exists.
DROP POLICY IF EXISTS chat_groups_select ON public.chat_groups;
CREATE POLICY chat_groups_select ON public.chat_groups FOR SELECT TO authenticated
  USING (public.is_chat_member(id) OR created_by = auth.uid());

SELECT 'ok' AS chk;

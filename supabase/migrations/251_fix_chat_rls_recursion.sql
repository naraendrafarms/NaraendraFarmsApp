-- Fix "infinite recursion detected in policy for relation chat_group_members":
-- the SELECT policy on chat_group_members queried chat_group_members itself
-- (to check "am I a member of this group"), and since that inner query is
-- also subject to RLS, Postgres re-evaluates the same policy forever.
-- Standard fix: a SECURITY DEFINER helper function bypasses RLS for the
-- membership check itself, so the policies that use it no longer recurse.

CREATE OR REPLACE FUNCTION public.is_chat_member(gid UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_group_members WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS chat_groups_select ON public.chat_groups;
CREATE POLICY chat_groups_select ON public.chat_groups FOR SELECT TO authenticated
  USING (public.is_chat_member(id));

DROP POLICY IF EXISTS chat_members_select ON public.chat_group_members;
CREATE POLICY chat_members_select ON public.chat_group_members FOR SELECT TO authenticated
  USING (public.is_chat_member(group_id));

DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_chat_member(group_id));

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_chat_member(group_id));

SELECT 'policies_after_fix' AS chk, count(*) FROM pg_policies
WHERE tablename IN ('chat_groups','chat_group_members','chat_messages');

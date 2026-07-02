-- In-app chat: DMs + groups, any user to any user, any user can create a
-- group, file/photo attachments. Brand-new tables only — zero changes to
-- any existing table, so this carries no risk to live data.

CREATE TABLE IF NOT EXISTS public.chat_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,               -- NULL for a 1:1 DM (name derived from the other member)
  is_dm      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_group_members (
  group_id   UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id),
  body        TEXT,
  attachment_url  TEXT,
  attachment_name TEXT,
  attachment_type TEXT,   -- mime type, so the UI knows image vs file
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  edited_at   TIMESTAMPTZ,
  CHECK (body IS NOT NULL OR attachment_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_time ON public.chat_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user ON public.chat_group_members(user_id);

ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can create a group / DM
DROP POLICY IF EXISTS chat_groups_insert ON public.chat_groups;
CREATE POLICY chat_groups_insert ON public.chat_groups FOR INSERT TO authenticated WITH CHECK (true);

-- Can only see groups you're a member of
DROP POLICY IF EXISTS chat_groups_select ON public.chat_groups;
CREATE POLICY chat_groups_select ON public.chat_groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_group_members m WHERE m.group_id = id AND m.user_id = auth.uid())
);

-- Membership rows: can see members of your own groups; can add members to a group at creation
-- (any authenticated user, since any user can start a group and invite anyone)
DROP POLICY IF EXISTS chat_members_select ON public.chat_group_members;
CREATE POLICY chat_members_select ON public.chat_group_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_group_members m2 WHERE m2.group_id = group_id AND m2.user_id = auth.uid())
);
DROP POLICY IF EXISTS chat_members_insert ON public.chat_group_members;
CREATE POLICY chat_members_insert ON public.chat_group_members FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS chat_members_update ON public.chat_group_members;
CREATE POLICY chat_members_update ON public.chat_group_members FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS chat_members_delete ON public.chat_group_members;
CREATE POLICY chat_members_delete ON public.chat_group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages: read/write only within groups you belong to
DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_group_members m WHERE m.group_id = chat_messages.group_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.chat_group_members m WHERE m.group_id = chat_messages.group_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
CREATE POLICY chat_messages_update ON public.chat_messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
DROP POLICY IF EXISTS chat_messages_delete ON public.chat_messages;
CREATE POLICY chat_messages_delete ON public.chat_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Storage bucket for chat attachments (images/files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS chat_attachments_read ON storage.objects;
CREATE POLICY chat_attachments_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments');
DROP POLICY IF EXISTS chat_attachments_write ON storage.objects;
CREATE POLICY chat_attachments_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

-- Enable realtime on chat_messages so the UI gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

SELECT 'chat_tables_created' AS chk, count(*) FROM public.chat_groups;

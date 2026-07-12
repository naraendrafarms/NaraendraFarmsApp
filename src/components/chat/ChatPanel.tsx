import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { MessageCircle, X, Send, Paperclip, Plus, ArrowLeft, Users as UsersIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatReplyToast } from '@/components/chat/ChatReplyToast'

interface ChatUser { id: string; full_name: string | null; email: string | null }
interface ChatGroupRow { id: string; name: string | null; is_dm: boolean }

function timeAgo(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Shared chat UI (conversation list / thread / composer). Used both inside
// the header's slide-over panel and the full-page /chat route — `onClose`
// is only passed by the slide-over, so the page version just omits the X.
export const ChatBody: React.FC<{ onClose?: () => void; active: boolean; initialGroupId?: string | null }> = ({ onClose, active, initialGroupId }) => {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [activeGroup, setActiveGroup] = useState<{ id: string; title: string } | null>(null)
  const [showNew, setShowNew] = useState(false)
  const myId = profile?.id

  const { data: users = [] } = useQuery({
    queryKey: ['chat_users'],
    enabled: active,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id,full_name,email').eq('is_active', true).order('full_name')
      return (data ?? []) as ChatUser[]
    }
  })
  const userMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users])

  const { data: groups = [] } = useQuery({
    queryKey: ['chat_groups', myId],
    enabled: active && !!myId,
    refetchInterval: active ? 8000 : false,
    queryFn: async () => {
      const { data: memberships } = await supabase.from('chat_group_members').select('group_id,last_read_at').eq('user_id', myId!)
      const groupIds = (memberships ?? []).map(m => m.group_id)
      if (!groupIds.length) return []
      const { data: groupRows } = await supabase.from('chat_groups').select('id,name,is_dm').in('id', groupIds)
      const { data: members } = await supabase.from('chat_group_members').select('group_id,user_id').in('group_id', groupIds)
      const { data: lastMsgs } = await supabase.from('chat_messages')
        .select('group_id,body,attachment_name,sender_id,created_at').in('group_id', groupIds)
        .order('created_at', { ascending: false })
      const lastByGroup: Record<string, any> = {}
      for (const m of (lastMsgs ?? [])) if (!lastByGroup[m.group_id]) lastByGroup[m.group_id] = m
      const readMap = Object.fromEntries((memberships ?? []).map(m => [m.group_id, m.last_read_at]))
      return (groupRows as ChatGroupRow[] ?? []).map(g => {
        const memberIds = (members ?? []).filter(m => m.group_id === g.id).map(m => m.user_id)
        const otherId = memberIds.find(id => id !== myId)
        const title = g.is_dm ? (userMap[otherId ?? '']?.full_name ?? 'User') : (g.name ?? 'Group')
        const last = lastByGroup[g.id]
        const unread = last && last.created_at > (readMap[g.id] ?? '') && last.sender_id !== myId
        return { id: g.id, title, is_dm: g.is_dm, last, unread }
      }).sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? ''))
    }
  })

  // Jumping here from a popup reply toast (clicked instead of replied inline)
  // — select that specific conversation once its title is known from `groups`.
  useEffect(() => {
    if (!initialGroupId || !groups.length) return
    const g = groups.find((g: any) => g.id === initialGroupId)
    if (g) setActiveGroup({ id: g.id, title: g.title })
  }, [initialGroupId, groups])

  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', activeGroup?.id],
    enabled: !!activeGroup,
    queryFn: async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('group_id', activeGroup!.id).order('created_at')
      return data ?? []
    }
  })

  useEffect(() => {
    if (!activeGroup) return
    const ch = supabase.channel(`chat_${activeGroup.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${activeGroup.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ['chat_messages', activeGroup.id] })
          // Thread is open and the new message is rendered immediately — mark
          // it read now too, or it re-appears as unread once you go back to
          // the conversation list (last_read_at was otherwise only set once,
          // at the moment the thread was first opened).
          if (myId) supabase.from('chat_group_members').update({ last_read_at: new Date().toISOString() })
            .eq('group_id', activeGroup.id).eq('user_id', myId).then(() => qc.invalidateQueries({ queryKey: ['chat_groups', myId] }))
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeGroup, qc, myId])

  useEffect(() => {
    if (activeGroup && myId) {
      supabase.from('chat_group_members').update({ last_read_at: new Date().toISOString() })
        .eq('group_id', activeGroup.id).eq('user_id', myId).then(() => qc.invalidateQueries({ queryKey: ['chat_groups', myId] }))
    }
  }, [activeGroup, myId, qc])

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const listEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { listEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const send = async (file?: File) => {
    if (!activeGroup || !myId || (!text.trim() && !file)) return
    setSending(true)
    try {
      let attachment_url: string | null = null, attachment_name: string | null = null, attachment_type: string | null = null
      if (file) {
        const path = `${activeGroup.id}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, file)
        if (upErr) throw upErr
        attachment_url = supabase.storage.from('chat-attachments').getPublicUrl(path).data.publicUrl
        attachment_name = file.name
        attachment_type = file.type
      }
      const { error } = await supabase.from('chat_messages').insert({
        group_id: activeGroup.id, sender_id: myId, body: text.trim() || null,
        attachment_url, attachment_name, attachment_type,
      })
      if (error) throw error
      setText('')
      qc.invalidateQueries({ queryKey: ['chat_messages', activeGroup.id] })
      qc.invalidateQueries({ queryKey: ['chat_groups', myId] })
    } catch (e: any) { toast.error(e.message) }
    finally { setSending(false) }
  }

  const startDM = async (otherId: string) => {
    if (!myId) return
    // Only reuse an EXISTING 1:1 DM — matching on any shared group_id would
    // also match a regular group chat both users happen to be in, silently
    // reusing it as if it were a private DM (privacy leak: messages typed
    // there go to the whole group, not just the intended person).
    const { data: mine } = await supabase.from('chat_group_members').select('group_id, chat_groups!inner(is_dm)').eq('user_id', myId).eq('chat_groups.is_dm', true)
    const { data: theirs } = await supabase.from('chat_group_members').select('group_id').eq('user_id', otherId)
    const mineIds = new Set((mine ?? []).map((m: any) => m.group_id))
    const existing = (theirs ?? []).find(t => mineIds.has(t.group_id))
    let groupId = existing?.group_id
    if (!groupId) {
      const { data: g, error } = await supabase.from('chat_groups').insert({ is_dm: true, created_by: myId }).select('id').single()
      if (error) { toast.error(error.message); return }
      groupId = g.id
      await supabase.from('chat_group_members').insert([{ group_id: groupId, user_id: myId }, { group_id: groupId, user_id: otherId }])
    }
    setShowNew(false)
    setActiveGroup({ id: groupId!, title: userMap[otherId]?.full_name ?? 'User' })
    qc.invalidateQueries({ queryKey: ['chat_groups', myId] })
  }

  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set())
  const createGroup = async () => {
    if (!myId || !groupName.trim() || groupMembers.size === 0) { toast.error('Name + at least one member required'); return }
    const { data: g, error } = await supabase.from('chat_groups').insert({ is_dm: false, name: groupName.trim(), created_by: myId }).select('id').single()
    if (error) { toast.error(error.message); return }
    const rows = [myId, ...Array.from(groupMembers)].map(user_id => ({ group_id: g.id, user_id }))
    await supabase.from('chat_group_members').insert(rows)
    setShowNew(false); setGroupName(''); setGroupMembers(new Set())
    setActiveGroup({ id: g.id, title: groupName.trim() })
    qc.invalidateQueries({ queryKey: ['chat_groups', myId] })
  }

  const anyUnread = groups.some((g: any) => g.unread)

  return (
    <div className="relative bg-white w-full h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {activeGroup ? (
          <button className="flex items-center gap-2 text-sm font-semibold" onClick={() => setActiveGroup(null)}>
            <ArrowLeft size={16} /> {activeGroup.title}
          </button>
        ) : <h2 className="text-sm font-semibold flex items-center gap-2">Discussions
          {anyUnread && <span className="w-2 h-2 rounded-full bg-red-500" />}
        </h2>}
        <div className="flex items-center gap-1">
          {!activeGroup && <button onClick={() => setShowNew(true)} className="p-1 rounded hover:bg-gray-100"><Plus size={16} /></button>}
          {onClose && <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>}
        </div>
      </div>

      {!activeGroup && !showNew && (
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No conversations yet. Tap + to start one.</p>}
          {groups.map((g: any) => (
            <button key={g.id} onClick={() => setActiveGroup({ id: g.id, title: g.title })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-left">
              <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {g.is_dm ? g.title[0]?.toUpperCase() : <UsersIcon size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${g.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{g.title}</p>
                <p className="text-xs text-gray-400 truncate">{g.last?.body ?? (g.last?.attachment_name ? '📎 ' + g.last.attachment_name : 'No messages yet')}</p>
              </div>
              {g.unread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name (leave blank for 1:1 chat)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <p className="text-xs text-gray-500">Pick people — tap one for a direct message, or several + a group name for a group.</p>
          <div className="space-y-1">
            {users.filter(u => u.id !== myId).map(u => (
              <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={groupMembers.has(u.id)}
                  onChange={e => setGroupMembers(prev => { const n = new Set(prev); e.target.checked ? n.add(u.id) : n.delete(u.id); return n })} />
                <span className="text-sm">{u.full_name ?? u.email}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 text-xs bg-gray-100 rounded-lg py-2" onClick={() => setShowNew(false)}>Cancel</button>
            {groupName.trim()
              ? <button className="flex-1 text-xs bg-green-600 text-white rounded-lg py-2" onClick={createGroup}>Create Group</button>
              : <button className="flex-1 text-xs bg-green-600 text-white rounded-lg py-2 disabled:opacity-40"
                  disabled={groupMembers.size !== 1} onClick={() => startDM(Array.from(groupMembers)[0])}>Start Chat</button>}
          </div>
        </div>
      )}

      {activeGroup && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m: any) => {
              const mine = m.sender_id === myId
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {!mine && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{userMap[m.sender_id]?.full_name ?? 'User'}</p>}
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    {m.attachment_url && (
                      m.attachment_type?.startsWith('image/')
                        ? <img src={m.attachment_url} alt={m.attachment_name} className="mt-1 rounded-lg max-w-full max-h-48" />
                        : <a href={m.attachment_url} target="_blank" rel="noreferrer" className={`mt-1 flex items-center gap-1 text-xs underline ${mine ? 'text-white' : 'text-green-700'}`}>
                            <Paperclip size={12} /> {m.attachment_name}
                          </a>
                    )}
                    <p className={`text-[10px] mt-1 ${mine ? 'text-green-100' : 'text-gray-400'}`}>{timeAgo(m.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={listEndRef} />
          </div>
          <div className="border-t border-gray-100 p-2 flex items-center gap-2">
            <input type="file" ref={fileRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = '' }} />
            <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-100 shrink-0"><Paperclip size={16} className="text-gray-400" /></button>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Message…"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm" />
            <button onClick={() => send()} disabled={sending} className="p-2 rounded-full bg-green-600 text-white disabled:opacity-40 shrink-0"><Send size={14} /></button>
          </div>
        </>
      )}
    </div>
  )
}

// Header icon + slide-over panel. Also runs a global, always-on subscription
// (independent of whether the panel is open) so a colleague gets a toast
// alert + red dot the instant a message arrives, not just when they happen
// to have the chat panel open.
export const ChatPanel: React.FC = () => {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const myId = profile?.id

  const { data: myGroupIds = [] } = useQuery({
    queryKey: ['chat_my_group_ids', myId],
    enabled: !!myId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase.from('chat_group_members').select('group_id').eq('user_id', myId!)
      return (data ?? []).map(r => r.group_id)
    }
  })

  useEffect(() => {
    if (!myId) return
    const ch = supabase.channel('chat_alerts_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload: any) => {
        const msg = payload.new
        if (msg.sender_id === myId || !myGroupIds.includes(msg.group_id)) return
        const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', msg.sender_id).single()
        toast.custom((t) => (
          <ChatReplyToast
            toastId={t.id}
            senderName={sender?.full_name ?? 'Someone'}
            body={msg.body}
            groupId={msg.group_id}
            myId={myId!}
            onOpenChat={(gid) => { setOpenGroupId(gid); setOpen(true) }}
          />
        ), { duration: 15000 })
        setHasUnread(true)
        qc.invalidateQueries({ queryKey: ['chat_groups', myId] })
        qc.invalidateQueries({ queryKey: ['chat_messages', msg.group_id] })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [myId, myGroupIds, qc])

  return (
    <>
      <button onClick={() => { setOpen(true); setHasUnread(false) }} className="relative p-1.5 rounded-lg hover:bg-gray-100" title="Chat">
        <MessageCircle size={18} className="text-gray-500" />
        {hasUnread && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end no-print" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="w-full max-w-sm h-full" onClick={e => e.stopPropagation()}>
            <ChatBody active={open} onClose={() => setOpen(false)} initialGroupId={openGroupId} />
          </div>
        </div>
      )}
    </>
  )
}

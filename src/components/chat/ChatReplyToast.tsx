import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Send, X } from 'lucide-react'

// Rendered inside toast.custom() from ChatPanel's global message subscription.
// A real popup card (not just a red-dot indicator) — shows who wrote what and
// lets you reply right there, without opening the chat panel first. Works on
// any screen size since it's just DOM inside react-hot-toast's container.
export const ChatReplyToast: React.FC<{
  toastId: string
  senderName: string
  body: string | null
  groupId: string
  myId: string
  onOpenChat: (groupId: string) => void
}> = ({ toastId, senderName, body, groupId, myId, onOpenChat }) => {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      group_id: groupId, sender_id: myId, body: reply.trim(),
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    toast.dismiss(toastId)
  }

  return (
    <div className="w-[92vw] max-w-sm bg-white rounded-xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <button className="text-left flex-1" onClick={() => { onOpenChat(groupId); toast.dismiss(toastId) }}>
          <p className="text-xs font-semibold text-gray-900">{senderName}</p>
          <p className="text-sm text-gray-700 mt-0.5 line-clamp-3">{body ?? '📎 sent a file'}</p>
        </button>
        <button onClick={() => toast.dismiss(toastId)} className="p-1 rounded hover:bg-gray-100 shrink-0">
          <X size={14} className="text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Reply…"
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button onClick={send} disabled={sending || !reply.trim()}
          className="p-1.5 rounded-lg bg-brand-600 text-white disabled:opacity-40 shrink-0">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

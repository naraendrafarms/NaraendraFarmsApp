import React, { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Global, always-on realtime subscription (mounted once in AppLayout,
// independent of whether the Tasks page is open) — the instant a task is
// assigned or reassigned to the current user, they get a popup toast, the
// same pattern chat_alerts_global uses for chat messages.
export const TaskAlerts: React.FC = () => {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const myId = profile?.id

  useEffect(() => {
    if (!myId) return

    const notify = async (taskId: string, title: string) => {
      toast(
        (t) => (
          <span
            onClick={() => { toast.dismiss(t.id); navigate('/tasks') }}
            className="cursor-pointer"
          >
            New task assigned: <span className="font-medium">{title}</span>
          </span>
        ),
        { icon: '📋', duration: 5000 }
      )
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my_tasks_widget', myId] })
    }

    const ch = supabase.channel('task_alerts_global')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `assigned_to_user_id=eq.${myId}` },
        (payload: any) => { if (payload.new.created_by !== myId) notify(payload.new.id, payload.new.title) }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `assigned_to_user_id=eq.${myId}` },
        (payload: any) => {
          // Only alert on a genuine (re)assignment to me, not every edit —
          // i.e. it wasn't already assigned to me before this update.
          if (payload.old?.assigned_to_user_id !== myId && payload.new.created_by !== myId) {
            notify(payload.new.id, payload.new.title)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [myId, qc, navigate])

  return null
}

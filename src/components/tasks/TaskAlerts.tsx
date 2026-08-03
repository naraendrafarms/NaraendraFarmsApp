import React, { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { sendBrowserNotification } from '@/lib/browserNotify'
import { OPEN_TASK_STATUSES } from '@/lib/tasks'

const DUE_NOTIFIED_KEY = 'nf_due_task_notified'
const today = () => new Date().toISOString().slice(0, 10)

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
      sendBrowserNotification('New task assigned', { body: title, tag: `task_${taskId}`, onClick: () => navigate('/tasks') })
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

  // Due-date reminders — nothing fires a DB event when a due date simply
  // arrives, so this polls periodically instead. Notifies at most once per
  // task per day (tracked in localStorage) so it doesn't repeat every poll.
  useEffect(() => {
    if (!myId) return

    const checkDueTasks = async () => {
      const { data } = await supabase.from('tasks')
        .select('id,title,due_date')
        .eq('assigned_to_user_id', myId)
        .in('status', OPEN_TASK_STATUSES)
        .lte('due_date', today())
        .not('due_date', 'is', null)
      if (!data?.length) return
      const notifiedRaw = localStorage.getItem(DUE_NOTIFIED_KEY)
      const notified: Record<string, string> = notifiedRaw ? JSON.parse(notifiedRaw) : {}
      const todayStr = today()
      let changed = false
      for (const t of data) {
        if (notified[t.id] === todayStr) continue
        const overdue = t.due_date < todayStr
        sendBrowserNotification(overdue ? 'Task overdue' : 'Task due today', {
          body: t.title, tag: `due_${t.id}_${todayStr}`, onClick: () => navigate('/tasks'),
        })
        notified[t.id] = todayStr
        changed = true
      }
      if (changed) localStorage.setItem(DUE_NOTIFIED_KEY, JSON.stringify(notified))
    }

    checkDueTasks()
    const interval = setInterval(checkDueTasks, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [myId, navigate])

  return null
}

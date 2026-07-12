import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui'
import { fmtDate, today } from '@/lib/utils'
import { ListTodo, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OPEN_TASK_STATUSES } from '@/lib/tasks'

// "What do I need to do today" — shown on the Dashboard so every user sees
// their own open tasks the moment they log in, without hunting for a filter.
export const MyTasksWidget: React.FC = () => {
  const { profile } = useAuth()

  const { data: tasks } = useQuery({
    queryKey: ['my_tasks_widget', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data } = await supabase.from('tasks')
        .select('id,title,due_date,priority,task_type,status')
        .eq('assigned_to_user_id', profile.id)
        .in('status', OPEN_TASK_STATUSES)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(6)
      return data ?? []
    },
    enabled: !!profile?.id,
  })

  if (!profile?.id) return null
  const rows = tasks ?? []

  return (
    <Card>
      <CardHeader title="My Tasks" subtitle="Assigned to you, still open"
        action={<Link to="/tasks" className="text-xs text-brand-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></Link>} />
      {rows.length === 0 ? (
        <EmptyState icon={<ListTodo size={24}/>} title="Nothing pending" subtitle="You're all caught up." />
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {rows.map((t: any) => {
            const overdue = t.due_date && t.due_date < today()
            return (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800">{t.title}</span>
                <span className="flex items-center gap-2">
                  {t.due_date && (
                    <span className={overdue ? 'text-red-600 font-medium text-xs' : 'text-gray-400 text-xs'}>
                      {fmtDate(t.due_date)}{overdue ? ' (overdue)' : ''}
                    </span>
                  )}
                  <Badge color={t.priority === 'urgent' || t.priority === 'high' ? 'red' : 'gray'}>{t.priority}</Badge>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

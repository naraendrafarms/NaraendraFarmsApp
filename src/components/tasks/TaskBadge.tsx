import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui'
import { OPEN_TASK_STATUSES } from '@/lib/tasks'

interface TaskBadgeProps {
  linkedTable: string
  linkedId?: string
}

// Small "N open task(s)" indicator for any record a task was assigned
// against — drop this next to a row/heading on any page.
export const TaskBadge: React.FC<TaskBadgeProps> = ({ linkedTable, linkedId }) => {
  const { data: count } = useQuery({
    queryKey: ['open_task_count', linkedTable, linkedId],
    queryFn: async () => {
      if (!linkedId) return 0
      const { count } = await supabase.from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('linked_table', linkedTable)
        .eq('linked_id', linkedId)
        .in('status', OPEN_TASK_STATUSES)
      return count ?? 0
    },
    enabled: !!linkedId,
  })

  if (!count) return null
  return <Badge color="orange">{count} task{count > 1 ? 's' : ''}</Badge>
}

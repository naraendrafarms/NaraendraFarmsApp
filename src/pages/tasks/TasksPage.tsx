import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { fmtDate, today } from '@/lib/utils'
import {
  Card, SectionHeader, Select, Table, Th, Td, Badge, Spinner, EmptyState, StatCard,
} from '@/components/ui'
import { AssignTaskButton } from '@/components/tasks/AssignTaskButton'
import { CheckCircle2, Circle, Clock, XCircle, Trash2, ListTodo, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  TASK_TYPE_OPTIONS, TASK_STATUS_OPTIONS, type TaskStatus, nextDueDate,
} from '@/lib/tasks'

const STATUS_BADGE: Record<TaskStatus, { color: any; label: string }> = {
  pending:     { color: 'gray',   label: 'Pending' },
  in_progress: { color: 'blue',   label: 'In Progress' },
  done:        { color: 'green',  label: 'Done' },
  cancelled:   { color: 'red',    label: 'Cancelled' },
}

const PRIORITY_COLOR: Record<string, any> = {
  low: 'gray', normal: 'blue', high: 'orange', urgent: 'red',
}

export const TasksPage: React.FC = () => {
  const { profile } = useAuth()
  const qc = useQueryClient()

  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFarm, setFilterFarm] = useState('')
  const [filterEmp, setFilterEmp] = useState('')

  const { data: farms } = useQuery({
    queryKey: ['tasks_farms_list'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: employees } = useQuery({
    queryKey: ['tasks_employees_list'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,name').eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filterType, filterStatus, filterFarm, filterEmp],
    queryFn: async () => {
      let q = supabase.from('tasks')
        .select('*, employees:assigned_to_employee_id(name), farms:farm_id(name,code)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500)
      if (filterType)   q = q.eq('task_type', filterType)
      if (filterStatus) q = q.eq('status', filterStatus)
      if (filterFarm)   q = q.eq('farm_id', filterFarm)
      if (filterEmp)    q = q.eq('assigned_to_employee_id', filterEmp)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    }
  })

  const setStatusMut = useMutation({
    mutationFn: async ({ task, status }: { task: any; status: TaskStatus }) => {
      const payload: any = { status, updated_at: new Date().toISOString() }
      if (status === 'done') {
        payload.completed_at = new Date().toISOString()
        payload.completed_by = profile?.id || null
      }
      const { error } = await supabase.from('tasks').update(payload).eq('id', task.id)
      if (error) throw error

      // Compliance tasks with a recurrence rule auto-spawn the next instance
      // when marked done, so the deadline never silently stops appearing.
      if (status === 'done' && task.task_type === 'compliance' && task.recurrence_rule) {
        const next = nextDueDate(task.due_date || today(), task.recurrence_rule)
        if (next) {
          const { error: insErr } = await supabase.from('tasks').insert({
            title: task.title,
            description: task.description,
            task_type: task.task_type,
            team: task.team,
            farm_id: task.farm_id,
            assigned_to_employee_id: task.assigned_to_employee_id,
            due_date: next,
            priority: task.priority,
            recurrence_rule: task.recurrence_rule,
            parent_task_id: task.id,
            created_by: profile?.id || null,
            status: 'pending',
          })
          if (insErr) throw insErr
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['open_task_count'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['tasks'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const rows = tasks ?? []
  const openCount = rows.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const overdueCount = rows.filter(t => t.due_date && t.due_date < today() && t.status !== 'done' && t.status !== 'cancelled').length
  const doneCount = rows.filter(t => t.status === 'done').length

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Tasks"
        subtitle="Admin, compliance deadlines and daily team task tracking"
        action={<AssignTaskButton label="New Task" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Open Tasks" value={openCount} icon={<ListTodo size={18}/>} />
        <StatCard title="Overdue" value={overdueCount} icon={<AlertTriangle size={18}/>} color="text-red-600" />
        <StatCard title="Completed" value={doneCount} icon={<CheckCircle2 size={18}/>} color="text-green-600" />
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <Select label="Type" placeholder="All types" options={TASK_TYPE_OPTIONS} value={filterType} onChange={e => setFilterType(e.target.value)} />
          <Select label="Status" placeholder="All statuses" options={TASK_STATUS_OPTIONS} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} />
          <Select label="Site / Farm" placeholder="All sites"
            options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
            value={filterFarm} onChange={e => setFilterFarm(e.target.value)} />
          <Select label="Assigned to" placeholder="Anyone"
            options={(employees ?? []).map((e: any) => ({ value: e.id, label: e.name }))}
            value={filterEmp} onChange={e => setFilterEmp(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<ListTodo size={32} />} title="No tasks found" subtitle="Assign a task from any page, or create one here." />
        ) : (
          <Table>
            <thead><tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Team / Site</Th>
              <Th>Assigned To</Th>
              <Th>Due Date</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Linked</Th>
              <Th right>Actions</Th>
            </tr></thead>
            <tbody>
              {rows.map((t: any) => {
                const overdue = t.due_date && t.due_date < today() && t.status !== 'done' && t.status !== 'cancelled'
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <Td>
                      <div className="font-medium text-gray-900">{t.title}</div>
                      {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                    </Td>
                    <Td><Badge color="gray">{TASK_TYPE_OPTIONS.find(o => o.value === t.task_type)?.label ?? t.task_type}</Badge></Td>
                    <Td>{t.farms?.name ?? t.team ?? '—'}</Td>
                    <Td>{t.employees?.name ?? (t.team ? `Team: ${t.team}` : '—')}</Td>
                    <Td className={overdue ? 'text-red-600 font-medium' : ''}>
                      {t.due_date ? fmtDate(t.due_date) : '—'}{overdue && ' (overdue)'}
                    </Td>
                    <Td><Badge color={PRIORITY_COLOR[t.priority] ?? 'gray'}>{t.priority}</Badge></Td>
                    <Td><Badge color={STATUS_BADGE[t.status as TaskStatus]?.color}>{STATUS_BADGE[t.status as TaskStatus]?.label ?? t.status}</Badge></Td>
                    <Td>{t.linked_label ?? '—'}</Td>
                    <Td right>
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== 'done' && t.status !== 'cancelled' && (
                          <>
                            {t.status === 'pending' && (
                              <button title="Start" onClick={() => setStatusMut.mutate({ task: t, status: 'in_progress' })}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Clock size={15} /></button>
                            )}
                            <button title="Mark Done" onClick={() => setStatusMut.mutate({ task: t, status: 'done' })}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><CheckCircle2 size={15} /></button>
                            <button title="Cancel" onClick={() => setStatusMut.mutate({ task: t, status: 'cancelled' })}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><XCircle size={15} /></button>
                          </>
                        )}
                        {t.status === 'done' && <Circle size={0} />}
                        <button title="Delete" onClick={() => { if (confirm('Delete this task?')) deleteMut.mutate(t.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

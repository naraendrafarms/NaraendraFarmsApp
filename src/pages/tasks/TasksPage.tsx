import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { fmtDate, today } from '@/lib/utils'
import {
  Card, SectionHeader, Select, Table, Th, Td, Badge, Spinner, EmptyState, StatCard,
  Modal, Input, Textarea, DateInput, FormRow, SearchableSelect,
} from '@/components/ui'
import { AssignTaskButton } from '@/components/tasks/AssignTaskButton'
import { CheckCircle2, Circle, Clock, XCircle, Trash2, ListTodo, AlertTriangle, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  TASK_TYPE_OPTIONS, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, RECURRENCE_PRESETS, type TaskStatus, nextDueDate,
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

  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFarm, setFilterFarm] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [editTask, setEditTask] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>(null)

  const effectiveUserFilter = scope === 'mine' ? (profile?.id ?? '') : filterUser

  const { data: farms } = useQuery({
    queryKey: ['tasks_farms_list'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: users } = useQuery({
    queryKey: ['tasks_users_list'],
    queryFn: async () => { const { data } = await supabase.from('profiles').select('id,full_name,role').eq('is_active', true).order('full_name'); return data ?? [] }
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filterType, filterStatus, filterFarm, effectiveUserFilter],
    queryFn: async () => {
      let q = supabase.from('tasks')
        .select('*, assignee:assigned_to_user_id(full_name,role), farms:farm_id(name,code)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500)
      if (filterType)   q = q.eq('task_type', filterType)
      if (filterStatus) q = q.eq('status', filterStatus)
      if (filterFarm)   q = q.eq('farm_id', filterFarm)
      if (effectiveUserFilter) q = q.eq('assigned_to_user_id', effectiveUserFilter)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: scope === 'all' || !!profile?.id,
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

      // Any task with a recurrence rule auto-spawns the next instance when
      // marked done, so the deadline/reminder never silently stops appearing.
      if (status === 'done' && task.recurrence_rule) {
        const next = nextDueDate(task.due_date || today(), task.recurrence_rule)
        if (next) {
          const { error: insErr } = await supabase.from('tasks').insert({
            title: task.title,
            description: task.description,
            task_type: task.task_type,
            team: task.team,
            farm_id: task.farm_id,
            assigned_to_user_id: task.assigned_to_user_id,
            due_date: next,
            priority: task.priority,
            recurrence_rule: task.recurrence_rule,
            is_private: task.is_private,
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

  const openEdit = (t: any) => {
    setEditTask(t)
    setEditForm({
      title: t.title ?? '', description: t.description ?? '', task_type: t.task_type,
      assigned_to_user_id: t.assigned_to_user_id ?? '', farm_id: t.farm_id ?? '',
      team: t.team ?? '', due_date: t.due_date ?? '', priority: t.priority ?? 'normal',
      recurrence_rule: t.recurrence_rule ?? '', is_private: !!t.is_private,
    })
  }

  const editMut = useMutation({
    mutationFn: async () => {
      if (!editTask) return
      if (!editForm.title.trim()) throw new Error('Title is required')
      const { error } = await supabase.from('tasks').update({
        title: editForm.title.trim(),
        description: editForm.description || null,
        task_type: editForm.task_type,
        assigned_to_user_id: editForm.assigned_to_user_id || null,
        farm_id: editForm.farm_id || null,
        team: editForm.team || null,
        due_date: editForm.due_date || null,
        priority: editForm.priority,
        recurrence_rule: editForm.recurrence_rule || null,
        is_private: editForm.is_private,
        updated_at: new Date().toISOString(),
      }).eq('id', editTask.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Task updated')
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my_tasks_widget'] })
      setEditTask(null)
    },
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

      <div className="flex gap-2">
        <button onClick={() => setScope('mine')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${scope === 'mine' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          My Tasks
        </button>
        <button onClick={() => setScope('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${scope === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All Tasks
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={scope === 'mine' ? 'My Open Tasks' : 'Open Tasks'} value={openCount} icon={<ListTodo size={18}/>} />
        <StatCard title="Overdue" value={overdueCount} icon={<AlertTriangle size={18}/>} color="text-red-600" />
        <StatCard title="Completed" value={doneCount} icon={<CheckCircle2 size={18}/>} color="text-green-600" />
      </div>

      <Card>
        <div className={`grid grid-cols-1 gap-3 mb-4 ${scope === 'all' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          <Select label="Type" placeholder="All types" options={TASK_TYPE_OPTIONS} value={filterType} onChange={e => setFilterType(e.target.value)} />
          <Select label="Status" placeholder="All statuses" options={TASK_STATUS_OPTIONS} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} />
          <Select label="Site / Farm" placeholder="All sites"
            options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
            value={filterFarm} onChange={e => setFilterFarm(e.target.value)} />
          {scope === 'all' && (
            <Select label="Assigned to" placeholder="Anyone"
              options={(users ?? []).map((u: any) => ({ value: u.id, label: u.full_name ?? 'Unnamed' }))}
              value={filterUser} onChange={e => setFilterUser(e.target.value)} />
          )}
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
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        {t.title}
                        {t.is_private && <span title="Private — only you, the assignee, and admin can see this">🔒</span>}
                        {t.recurrence_rule && <span title="Recurring">🔁</span>}
                      </div>
                      {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                    </Td>
                    <Td><Badge color="gray">{TASK_TYPE_OPTIONS.find(o => o.value === t.task_type)?.label ?? t.task_type}</Badge></Td>
                    <Td>{t.farms?.name ?? t.team ?? '—'}</Td>
                    <Td>{t.assignee?.full_name ?? (t.team ? `Team: ${t.team}` : '—')}</Td>
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
                        <button title="Edit" onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
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

      {editTask && editForm && (
        <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg"
          footer={<>
            <button onClick={() => setEditTask(null)} className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => editMut.mutate()} disabled={editMut.isPending}
              className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
              {editMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          <div className="flex flex-col gap-3">
            <Input label="Title" required value={editForm.title} onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))} />
            <Textarea label="Description" value={editForm.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} />
            <FormRow cols={2}>
              <Select label="Type" options={TASK_TYPE_OPTIONS} value={editForm.task_type} onChange={e => setEditForm((f: any) => ({ ...f, task_type: e.target.value }))} />
              <Select label="Priority" options={TASK_PRIORITY_OPTIONS} value={editForm.priority} onChange={e => setEditForm((f: any) => ({ ...f, priority: e.target.value }))} />
            </FormRow>
            <FormRow cols={2}>
              <SearchableSelect
                label="Assign to person — this is who sees it in My Tasks"
                placeholder="Unassigned"
                options={(users ?? []).map((u: any) => ({ value: u.id, label: u.full_name ?? 'Unnamed' }))}
                value={editForm.assigned_to_user_id}
                onChange={v => setEditForm((f: any) => ({ ...f, assigned_to_user_id: v }))}
              />
              <Select label="Site / Farm (optional)" placeholder="Any site"
                options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
                value={editForm.farm_id} onChange={e => setEditForm((f: any) => ({ ...f, farm_id: e.target.value }))} />
            </FormRow>
            <FormRow cols={2}>
              <Input label="Team label (optional, just a tag)" value={editForm.team} onChange={e => setEditForm((f: any) => ({ ...f, team: e.target.value }))} />
              <DateInput label="Due Date" value={editForm.due_date} onChange={e => setEditForm((f: any) => ({ ...f, due_date: e.target.value }))} />
            </FormRow>
            <Select label="Recurrence" options={RECURRENCE_PRESETS} value={editForm.recurrence_rule} onChange={e => setEditForm((f: any) => ({ ...f, recurrence_rule: e.target.value }))} />
            <label className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={editForm.is_private}
                onChange={e => setEditForm((f: any) => ({ ...f, is_private: e.target.checked }))} />
              <span>Private — only you, whoever it's assigned to, and admin can see this. Won't show under "All Tasks" for anyone else.</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

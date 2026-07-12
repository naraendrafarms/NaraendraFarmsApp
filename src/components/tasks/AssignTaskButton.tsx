import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { today } from '@/lib/utils'
import { Button, Modal, Input, Textarea, Select, DateInput, FormRow, SearchableSelect } from '@/components/ui'
import { ListPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { TASK_TYPE_OPTIONS, TASK_PRIORITY_OPTIONS, RECURRENCE_PRESETS, type TaskType } from '@/lib/tasks'

interface AssignTaskButtonProps {
  // Optional link back to the record this task was raised from — shown from
  // any page (e.g. a GRN row, a flock, an employee). Purely informational;
  // no FK constraint since it can reference any table in the app.
  linkedTable?: string
  linkedId?: string
  linkedLabel?: string
  defaultTitle?: string
  small?: boolean
  label?: string
}

const emptyForm = (defaultTitle?: string) => ({
  title: defaultTitle ?? '',
  description: '',
  task_type: 'daily' as TaskType,
  assigned_to_employee_id: '',
  team: '',
  farm_id: '',
  due_date: today(),
  priority: 'normal',
  recurrence_rule: '',
})

export const AssignTaskButton: React.FC<AssignTaskButtonProps> = ({
  linkedTable, linkedId, linkedLabel, defaultTitle, small, label = 'Assign Task',
}) => {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm(defaultTitle))
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: employees } = useQuery({
    queryKey: ['tasks_employees_list'],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('id,name').eq('is_active', true).order('name')
      return data ?? []
    },
    enabled: open,
  })
  const { data: farms } = useQuery({
    queryKey: ['tasks_farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    },
    enabled: open,
  })

  const openModal = () => { setForm(emptyForm(defaultTitle)); setOpen(true) }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error('Title is required')
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        task_type: form.task_type,
        team: form.team || null,
        farm_id: form.farm_id || null,
        assigned_to_employee_id: form.assigned_to_employee_id || null,
        due_date: form.due_date || null,
        priority: form.priority,
        recurrence_rule: form.task_type === 'compliance' ? (form.recurrence_rule || null) : null,
        linked_table: linkedTable || null,
        linked_id: linkedId || null,
        linked_label: linkedLabel || null,
        created_by: profile?.id || null,
        status: 'pending',
      }
      const { error } = await supabase.from('tasks').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Task assigned')
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['open_task_count', linkedTable, linkedId] })
      setOpen(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <>
      <Button variant="outline" size={small ? 'xs' : 'sm'} icon={<ListPlus size={14} />} onClick={openModal}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Assign Task" size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={mut.isPending} onClick={() => mut.mutate()}>Assign</Button>
        </>}
      >
        <div className="flex flex-col gap-3">
          {linkedLabel && (
            <div className="text-xs bg-brand-50 text-brand-700 rounded-lg px-3 py-2">
              Linked to: <span className="font-medium">{linkedLabel}</span>
            </div>
          )}
          <Input label="Title" required value={form.title} onChange={e => s('title', e.target.value)} />
          <Textarea label="Description" value={form.description} onChange={e => s('description', e.target.value)} />
          <FormRow cols={2}>
            <Select label="Type" options={TASK_TYPE_OPTIONS} value={form.task_type} onChange={e => s('task_type', e.target.value)} />
            <Select label="Priority" options={TASK_PRIORITY_OPTIONS} value={form.priority} onChange={e => s('priority', e.target.value)} />
          </FormRow>
          <FormRow cols={2}>
            <SearchableSelect
              label="Assign to person (optional)"
              placeholder="Unassigned"
              options={(employees ?? []).map((e: any) => ({ value: e.id, label: e.name }))}
              value={form.assigned_to_employee_id}
              onChange={v => s('assigned_to_employee_id', v)}
            />
            <Select label="Site / Farm (optional)" placeholder="Any site"
              options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
              value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
          </FormRow>
          <FormRow cols={2}>
            <Input label="Team (optional, e.g. Accounts / Admin / Site)" value={form.team} onChange={e => s('team', e.target.value)} />
            <DateInput label="Due Date" value={form.due_date} onChange={e => s('due_date', e.target.value)} />
          </FormRow>
          {form.task_type === 'compliance' && (
            <Select label="Recurrence" options={RECURRENCE_PRESETS} value={form.recurrence_rule} onChange={e => s('recurrence_rule', e.target.value)} />
          )}
        </div>
      </Modal>
    </>
  )
}

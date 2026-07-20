// Shared helpers for the Tasks module — used by TasksPage, AssignTaskButton
// and TaskBadge so recurrence math and query keys stay in one place.

export type TaskType = 'daily' | 'compliance' | 'admin'
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export const TASK_TYPE_OPTIONS: Array<{ value: TaskType; label: string }> = [
  { value: 'daily',      label: 'Daily / Team Task' },
  { value: 'compliance', label: 'Compliance (GST/TDS/PF/ESI)' },
  { value: 'admin',      label: 'Admin' },
]

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
  { value: 'cancelled',   label: 'Cancelled' },
]

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low',    label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

// Recurrence rule formats: "daily", "monthly:DD", "quarterly:DD", "yearly:MM-DD"
export const RECURRENCE_PRESETS = [
  { value: '',              label: 'One-time (no recurrence)' },
  { value: 'daily',         label: 'Daily' },
  { value: 'monthly:7',     label: 'Monthly — 7th (e.g. TDS payment)' },
  { value: 'monthly:15',    label: 'Monthly — 15th' },
  { value: 'monthly:20',    label: 'Monthly — 20th (e.g. GSTR-3B)' },
  { value: 'quarterly:31',  label: 'Quarterly — 31st (e.g. TDS return)' },
  { value: 'yearly:03-31',  label: 'Yearly — 31 March' },
]

// Given a completed task's due_date and its recurrence_rule, compute the next
// instance's due date. Returns null if the rule is empty/unrecognized.
export function nextDueDate(currentDue: string, rule: string | null | undefined): string | null {
  if (!rule) return null
  const [freq, param] = rule.split(':')
  const base = currentDue ? new Date(currentDue + 'T00:00:00') : new Date()

  if (freq === 'daily') {
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1)
    return toISODate(next)
  }
  if (freq === 'monthly') {
    const day = parseInt(param, 10) || 1
    const next = new Date(base.getFullYear(), base.getMonth() + 1, day)
    return toISODate(next)
  }
  if (freq === 'quarterly') {
    const day = parseInt(param, 10) || 1
    const next = new Date(base.getFullYear(), base.getMonth() + 3, day)
    return toISODate(next)
  }
  if (freq === 'yearly') {
    const [mm, dd] = (param || '01-01').split('-').map(n => parseInt(n, 10))
    const next = new Date(base.getFullYear() + 1, (mm || 1) - 1, dd || 1)
    return toISODate(next)
  }
  return null
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const OPEN_TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress']

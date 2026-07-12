import { supabase } from '@/lib/supabase'

export interface SearchHit {
  type: string
  icon: string
  title: string
  subtitle?: string
  to: string
}

// Each source: which table/columns to search, how to render a hit, and
// where to send the user. Kept to the modules people actually hunt for by
// name/number day-to-day — add more sources here as needed.
async function searchEmployees(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('employees')
    .select('id,name,emp_id,designation')
    .or(`name.ilike.%${q}%,emp_id.ilike.%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Employee', icon: '👤', title: r.name, subtitle: [r.emp_id, r.designation].filter(Boolean).join(' · '),
    to: '/employees',
  }))
}

async function searchFlocks(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('flocks')
    .select('id,flock_no,status')
    .ilike('flock_no', `%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Flock', icon: '🐔', title: `Flock ${r.flock_no}`, subtitle: r.status ?? undefined,
    to: `/flock/${r.flock_no}`,
  }))
}

async function searchParties(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('parties')
    .select('id,name,party_type')
    .ilike('name', `%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Party / Supplier', icon: '🏢', title: r.name, subtitle: r.party_type ?? undefined,
    to: '/masters/parties',
  }))
}

async function searchBills(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('pending_payments')
    .select('id,vendor_name,invoice_no,grn_no,net_payable,invoice_amount')
    .or(`vendor_name.ilike.%${q}%,invoice_no.ilike.%${q}%,grn_no.ilike.%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Bill / GRN', icon: '🧾', title: r.vendor_name, subtitle: [r.invoice_no, r.grn_no].filter(Boolean).join(' · '),
    to: '/pending-payments',
  }))
}

async function searchTasks(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('tasks')
    .select('id,title,status,task_type')
    .ilike('title', `%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Task', icon: '📋', title: r.title, subtitle: `${r.task_type} · ${r.status}`,
    to: '/tasks',
  }))
}

async function searchFarms(q: string): Promise<SearchHit[]> {
  const { data } = await supabase.from('farms')
    .select('id,name,code')
    .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
    .limit(5)
  return (data ?? []).map(r => ({
    type: 'Site / Farm', icon: '🏭', title: r.name, subtitle: r.code ?? undefined,
    to: '/masters/farms',
  }))
}

export async function searchAppData(q: string): Promise<SearchHit[]> {
  if (q.trim().length < 2) return []
  const results = await Promise.allSettled([
    searchEmployees(q), searchFlocks(q), searchParties(q),
    searchBills(q), searchTasks(q), searchFarms(q),
  ])
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

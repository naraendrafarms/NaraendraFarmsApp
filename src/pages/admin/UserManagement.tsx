import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth, type Role } from '@/lib/auth'
import {
  Card, Button, Input, Select, FormRow, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Edit2, Shield, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'admin',         label: 'Administrator',  desc: 'Full access — all data, users, masters' },
  { value: 'management',    label: 'Management',     desc: 'View all reports, dashboards and financials. No data entry.' },
  { value: 'accounts',      label: 'Accounts',       desc: 'All entry access — financial, salary, GRN, imports' },
  { value: 'site_manager',  label: 'Site Manager',   desc: 'All sites — daily entry, flocks, reports. No salary.' },
  { value: 'site_incharge', label: 'Site Incharge',  desc: 'Own site only — daily entry, HE, medicine' },
  { value: 'viewer',        label: 'Viewer',         desc: 'View and reports only — no data entry' },
]

const ROLE_COLORS: Record<Role, any> = {
  admin:         'red',
  management:    'purple',
  accounts:      'blue',
  site_manager:  'orange',
  site_incharge: 'green',
  viewer:        'gray',
}

export const UserManagement: React.FC = () => {
  const qc = useQueryClient()
  const { profile: myProfile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'viewer' as Role, farm_id: '', is_active: 'true'
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users_admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, farms(name,code)')
        .order('full_name')
      return data ?? []
    }
  })

  const openAdd = () => {
    setEditing(null)
    setForm({ full_name: '', email: '', password: '', role: 'viewer', farm_id: '', is_active: 'true' })
    setShowForm(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setForm({ full_name: u.full_name ?? '', email: u.email ?? '', password: '', role: u.role, farm_id: u.farm_id ?? '', is_active: u.is_active ? 'true' : 'false' })
    setShowForm(true)
  }

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.email || !form.password || !form.full_name) throw new Error('Name, email and password required')
      const { data, error } = await supabase.rpc('admin_create_user', {
        p_email:     form.email,
        p_password:  form.password,
        p_full_name: form.full_name,
        p_role:      form.role,
        p_farm_id:   form.farm_id || null,
        p_is_active: form.is_active === 'true',
      })
      if (error) throw error
      if (!data) throw new Error('User creation failed')
    },
    onSuccess: () => { toast.success('User created!'); qc.invalidateQueries({ queryKey: ['users_admin'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) return
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        role: form.role,
        farm_id: form.farm_id || null,
        is_active: form.is_active === 'true',
      }).eq('id', editing.id)
      if (error) throw error
      if (form.password) {
        const { error: pwErr } = await supabase.rpc('admin_update_user_password', {
          p_user_id:  editing.id,
          p_password: form.password,
        })
        if (pwErr) throw pwErr
      }
    },
    onSuccess: () => { toast.success('User updated!'); qc.invalidateQueries({ queryKey: ['users_admin'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const toggleActive = async (u: any) => {
    const { error } = await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id)
    if (error) toast.error(error.message)
    else { toast.success(u.is_active ? 'User deactivated' : 'User activated'); qc.invalidateQueries({ queryKey: ['users_admin'] }) }
  }

  const farmOptions = farms?.map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` })) ?? []
  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-5">
      <SectionHeader title="User Management" subtitle="Manage who can access the app and what they can do"
        action={<Button icon={<Plus size={16}/>} onClick={openAdd}>Add User</Button>} />

      {/* Role guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
            <Badge color={ROLE_COLORS[r.value]}>{r.label}</Badge>
            <p className="text-xs text-gray-500 self-center">{r.desc}</p>
          </div>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Site Access</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                        {u.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium">{u.full_name ?? '—'}</span>
                      {u.id === myProfile?.id && <span className="text-[10px] text-gray-400">(you)</span>}
                    </div>
                  </Td>
                  <Td className="text-xs text-gray-500">{u.email ?? '—'}</Td>
                  <Td><Badge color={ROLE_COLORS[u.role as Role] ?? 'gray'}>{ROLES.find(r => r.value === u.role)?.label ?? u.role}</Badge></Td>
                  <Td className="text-xs">
                    {u.role === 'site_incharge'
                      ? (u.farms ? <span className="font-medium text-green-700">{u.farms.name}</span> : <span className="text-orange-500">No site assigned</span>)
                      : <span className="text-gray-400">All sites</span>
                    }
                  </Td>
                  <Td>
                    <Badge color={u.is_active ? 'green' : 'gray'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      {u.id !== myProfile?.id && (
                        <button onClick={() => toggleActive(u)} className={`p-1.5 rounded transition-colors ${u.is_active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <UserX size={13}/> : <UserCheck size={13}/>}
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {users?.length === 0 && <EmptyState icon={<Shield size={32}/>} title="No users yet" action={<Button onClick={openAdd} icon={<Plus size={16}/>}>Add First User</Button>} />}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Add New User'} size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={isPending} onClick={() => editing ? updateMut.mutate() : createMut.mutate()}>
            {editing ? 'Update' : 'Create User'}
          </Button>
        </>}>
        <div className="space-y-4">
          <Input label="Full Name" required value={form.full_name} onChange={e => s('full_name', e.target.value)} hint="e.g. Ravi Kumar" />
          {!editing && (
            <FormRow>
              <Input label="Email" required type="email" value={form.email} onChange={e => s('email', e.target.value)} />
              <Input label="Password" required type="password" value={form.password} onChange={e => s('password', e.target.value)} hint="Min 8 characters" />
            </FormRow>
          )}
          {editing && (
            <Input label="New Password" type="password" value={form.password} onChange={e => s('password', e.target.value)} hint="Leave blank to keep current password" />
          )}
          <Select label="Role" required
            options={ROLES.map(r => ({ value: r.value, label: `${r.label} — ${r.desc}` }))}
            value={form.role} onChange={e => s('role', e.target.value)} />

          {form.role === 'site_incharge' && (
            <Select label="Assigned Site" required placeholder="— Select the site this person manages —"
              options={farmOptions} value={form.farm_id} onChange={e => s('farm_id', e.target.value)}
              hint="Site Incharge can only see data from this site" />
          )}

          <Select label="Status" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
            value={form.is_active} onChange={e => s('is_active', e.target.value)} />

          {/* Permission summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-1">This role can:</p>
            {form.role === 'admin' && <p>✓ Everything — full admin access including user management</p>}
            {form.role === 'management' && <>
              <p>✓ View all reports, dashboards and financial summaries</p>
              <p>✓ Hatchability, production, P&L reports across all sites</p>
              <p>✗ Cannot enter or modify data, or manage users</p>
            </>}
            {form.role === 'accounts' && <>
              <p>✓ Enter and view all data across all sites</p>
              <p>✓ Salary, GRN, Import, Finance</p>
              <p>✗ Cannot manage user accounts</p>
            </>}
            {form.role === 'site_manager' && <>
              <p>✓ View all sites and enter operational data</p>
              <p>✓ Daily records, HE, feed, flocks</p>
              <p>✗ Cannot view salary or manage users/masters</p>
            </>}
            {form.role === 'site_incharge' && <>
              <p>✓ Enter daily records, HE dispatch, medicine for their site only</p>
              <p>✗ Cannot see other sites, salary, or masters</p>
            </>}
            {form.role === 'viewer' && <>
              <p>✓ View all reports and dashboards</p>
              <p>✗ Cannot enter or modify any data</p>
            </>}
          </div>
        </div>
      </Modal>
    </div>
  )
}

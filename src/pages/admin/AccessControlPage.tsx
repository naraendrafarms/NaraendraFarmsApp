import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, SectionHeader, Spinner, Badge } from '@/components/ui'
import { MODULES } from '@/lib/modules'
import type { Role } from '@/lib/auth'
import toast from 'react-hot-toast'

const ROLES: { key: Role; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'management', label: 'Management' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'site_manager', label: 'Site Manager' },
  { key: 'site_incharge', label: 'Site Incharge' },
  { key: 'viewer', label: 'Viewer' },
]

const LEVELS: { value: 'hidden' | 'read_only' | 'full'; label: string; className: string }[] = [
  { value: 'hidden', label: 'Hidden', className: 'bg-gray-100 text-gray-500' },
  { value: 'read_only', label: 'Read-only', className: 'bg-amber-100 text-amber-700' },
  { value: 'full', label: 'Full', className: 'bg-green-100 text-green-700' },
]

export const AccessControlPage: React.FC = () => {
  const qc = useQueryClient()
  const [saving, setSaving] = useState<string | null>(null)

  const { data: rows, isLoading } = useQuery({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('id,role,module_key,level')
      if (error) throw error
      return data ?? []
    },
  })

  // role|module_key -> row
  const byKey = useMemo(() => {
    const m = new Map<string, any>()
    for (const r of rows ?? []) m.set(`${r.role}|${r.module_key}`, r)
    return m
  }, [rows])

  const saveMut = useMutation({
    mutationFn: async ({ role, moduleKey, level }: { role: Role; moduleKey: string; level: string }) => {
      // Admin is hardcoded full in the app regardless of this table (see
      // hasModule in auth.ts) — refuse to even try to change it, so the grid
      // never implies an admin lockout is possible.
      if (role === 'admin') throw new Error('Admin always has full access — this cannot be changed here')
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('role_permissions')
        .upsert({ role, module_key: moduleKey, level, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'role,module_key' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role_permissions'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const setLevel = async (role: Role, moduleKey: string, level: string) => {
    setSaving(`${role}|${moduleKey}`)
    await saveMut.mutateAsync({ role, moduleKey, level })
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Access Control" subtitle="Which pages each role can see or edit — admin only. Changes take effect for other users on their next page load, not instantly mid-session." />
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        Site-level scoping (a Site Incharge only seeing their own farm's data) is separate from this and always applies on top, regardless of what's set here. This grid only controls whether a whole page/section is visible at all.
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-white">Module</th>
                  {ROLES.map(r => (
                    <th key={r.key} className="px-3 py-2 font-semibold text-gray-600 text-center whitespace-nowrap">
                      {r.label}{r.key === 'admin' && <Badge color="red">always full</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod => (
                  <tr key={mod.key} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-3 py-2 font-medium text-gray-800 sticky left-0 bg-white">{mod.label}</td>
                    {ROLES.map(r => {
                      if (r.key === 'admin') {
                        return <td key={r.key} className="px-3 py-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-semibold">Full</span>
                        </td>
                      }
                      const current = byKey.get(`${r.key}|${mod.key}`)?.level ?? 'hidden'
                      const cellKey = `${r.key}|${mod.key}`
                      return (
                        <td key={r.key} className="px-3 py-2 text-center">
                          <select
                            value={current}
                            disabled={saving === cellKey}
                            onChange={e => setLevel(r.key, mod.key, e.target.value)}
                            className={`text-xs rounded px-2 py-1 border-0 font-medium cursor-pointer ${LEVELS.find(l => l.value === current)?.className ?? ''}`}
                          >
                            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="text-xs text-gray-400 px-1 space-y-1">
        <p><strong>Hidden</strong> — the page/section doesn't appear in navigation and can't be opened directly by URL either.</p>
        <p><strong>Read-only</strong> — the page is visible, but forms/save-buttons on it are not yet automatically disabled by this setting (that's a follow-up per-page change) — treat Read-only as "visible" for now.</p>
        <p><strong>Full</strong> — normal access, same as today.</p>
      </div>
    </div>
  )
}

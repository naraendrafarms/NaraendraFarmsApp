import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Button, Badge, Table, Th, Td, EmptyState } from '@/components/ui'
import { RefreshCw, ShieldCheck, AlertTriangle, Info, CheckCircle2, HardDrive } from 'lucide-react'
import toast from 'react-hot-toast'

// What the farm's books say against what they should say.
//
// Every fault found by hand so far had the same shape: two figures that must
// agree, quietly disagreeing — feed produced against ingredients coming off
// stock, GRNs against the ledger, bird sales against shed records. A person
// finds that by luck. These rules find it every night at 4am, and each one is
// written so that ZERO is the only correct answer.
//
// Admin only, and that is enforced by the row policy on the table as well as
// by the route: this page names bills, items and flocks that are wrong.

type Result = {
  id: string; run_at: string; check_key: string; title: string; module: string
  severity: 'critical' | 'warning' | 'info'; failed_count: number
  detail: string | null; what_it_means: string | null
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }

type Usage = {
  measured_at: string
  db_bytes: number; db_limit: number
  storage_bytes: number; storage_limit: number
  tables: { name: string; bytes: number; rows: number }[] | null
  audit: { rows: number; bytes: number; last_7d: number; oldest: string | null; with_values: number }
}

const mb = (b: number) => b / 1048576
const fmtSize = (b: number) => mb(b) >= 1024 ? `${(mb(b) / 1024).toFixed(2)} GB` : `${mb(b).toFixed(1)} MB`

// How much of the free plan is gone, and how long the rest lasts at today's rate.
const UsagePanel: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['usage_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_usage_stats')
      if (error) throw error
      return data as Usage
    },
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <Card><Spinner /></Card>
  if (error || !data) return null

  const dbPct = (data.db_bytes / data.db_limit) * 100
  const stPct = (data.storage_bytes / data.storage_limit) * 100
  const perDay = data.audit.last_7d / 7
  // The audit log is the only table growing fast enough to matter, so the
  // runway is measured from its own rate rather than the database as a whole.
  const bytesPerEntry = data.audit.rows > 0 ? data.audit.bytes / data.audit.rows : 0
  const daysLeft = perDay > 0 && bytesPerEntry > 0
    ? Math.round((data.db_limit - data.db_bytes) / (perDay * bytesPerEntry))
    : null

  const bar = (pct: number) => (
    <div className="h-2 rounded bg-gray-100 overflow-hidden">
      <div className={`h-full ${pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
           style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <HardDrive size={16} className="text-gray-400" />
        <h3 className="font-semibold">Supabase usage — free plan</h3>
        <span className="text-xs text-gray-400">measured {String(data.measured_at).slice(11, 16)}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Database</span>
            <span className="font-semibold">{fmtSize(data.db_bytes)} of 500 MB ({dbPct.toFixed(0)}%)</span>
          </div>
          {bar(dbPct)}
          {daysLeft !== null && (
            <p className={`text-xs mt-1 ${daysLeft < 60 ? 'text-red-600' : 'text-gray-500'}`}>
              About {daysLeft} days left at the present rate of {Math.round(perDay).toLocaleString()} audit entries a day.
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">File storage</span>
            <span className="font-semibold">{fmtSize(data.storage_bytes)} of 1 GB ({stPct.toFixed(1)}%)</span>
          </div>
          {bar(stPct)}
          <p className="text-xs text-gray-500 mt-1">
            Backups are kept in GitHub, not here, so this stays near empty.
          </p>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Largest tables</p>
          <div className="space-y-0.5">
            {(data.tables ?? []).slice(0, 8).map(t => (
              <div key={t.name} className="flex justify-between text-xs">
                <span className="text-gray-600 truncate">{t.name}</span>
                <span className="text-gray-500 tabular-nums shrink-0 pl-2">
                  {fmtSize(t.bytes)} · {Number(t.rows).toLocaleString()} rows
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Audit trail</p>
          <div className="space-y-0.5 text-xs text-gray-600">
            <div className="flex justify-between"><span>Entries</span><span className="tabular-nums">{data.audit.rows.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Size</span><span className="tabular-nums">{fmtSize(data.audit.bytes)}</span></div>
            <div className="flex justify-between"><span>Last 7 days</span><span className="tabular-nums">{data.audit.last_7d.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Oldest kept</span>
              <span className="tabular-nums">{data.audit.oldest ? fmtDate(String(data.audit.oldest).slice(0, 10)) : '—'}</span></div>
            <div className="flex justify-between"><span>With before/after values</span><span className="tabular-nums">{data.audit.with_values.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>
          GitHub and Cloudflare usage is not shown here — reading it needs an API token for each,
          which the app does not hold.
        </span>
      </p>
    </Card>
  )
}

export const HealthCheckPage: React.FC = () => {
  const qc = useQueryClient()
  const [showPassing, setShowPassing] = useState(true)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['health_check_latest'],
    queryFn: async () => {
      // Latest run only — the history stays in the table for comparison, but
      // what matters on screen is where the books stand now.
      const { data: last, error: e1 } = await supabase.from('health_check_results')
        .select('run_at').order('run_at', { ascending: false }).limit(1)
      if (e1) throw e1
      const runAt = (last ?? [])[0]?.run_at
      if (!runAt) return []
      const { data, error } = await supabase.from('health_check_results')
        .select('*').eq('run_at', runAt).order('title')
      if (error) throw error
      return (data ?? []) as Result[]
    },
  })

  const runMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('fn_run_health_checks')
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health_check_latest'] }); toast.success('Checks run') },
    onError: (e: any) => toast.error(e.message),
  })

  const sorted = [...(rows as Result[])].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3) ||
    (b.failed_count > 0 ? 1 : 0) - (a.failed_count > 0 ? 1 : 0) ||
    a.title.localeCompare(b.title))

  const shown = showPassing ? sorted : sorted.filter(r => r.failed_count > 0)
  const runAt = (rows as Result[])[0]?.run_at
  const failing = sorted.filter(r => r.failed_count > 0)
  const critical = failing.filter(r => r.severity === 'critical')
  const allClear = sorted.length > 0 && failing.length === 0

  const sevBadge = (s: string) =>
    s === 'critical' ? <Badge color="red">Critical</Badge>
    : s === 'warning' ? <Badge color="yellow">Warning</Badge>
    : <Badge color="gray">Note</Badge>

  return (
    <div className="space-y-5">
      <SectionHeader title="Health Check"
        subtitle="Figures that must agree, checked against each other every night at 4am. Zero is the only correct answer to each rule."
        action={<Button icon={<RefreshCw size={16} />} loading={runMut.isPending} onClick={() => runMut.mutate()}>Run now</Button>}
      />

      <UsagePanel />

      {isLoading ? <Spinner /> : sorted.length === 0 ? (
        <Card><EmptyState icon={<ShieldCheck size={28} />} title="No checks have run yet"
          subtitle="Press Run now, or wait for tonight's run at 4am." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs text-gray-400">Last run</p>
              <p className="text-lg font-bold">{fmtDate(String(runAt).slice(0, 10))}</p>
              <p className="text-xs text-gray-400">{String(runAt).slice(11, 16)}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Rules checked</p>
              <p className="text-lg font-bold">{sorted.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Critical failures</p>
              <p className={`text-lg font-bold ${critical.length ? 'text-red-600' : 'text-green-700'}`}>{critical.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Rules with findings</p>
              <p className={`text-lg font-bold ${failing.length ? 'text-orange-600' : 'text-green-700'}`}>{failing.length}</p>
            </Card>
          </div>

          {allClear && (
            <Card>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={18} />
                <span className="font-semibold">Everything agrees.</span>
                <span className="text-sm text-gray-500">All {sorted.length} rules returned zero.</span>
              </div>
            </Card>
          )}

          {critical.length > 0 && (
            <Card>
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-700">
                    {critical.length} critical {critical.length === 1 ? 'rule' : 'rules'} failed — a task has been raised on the Development list.
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    Critical means a figure somewhere in the app is wrong right now, not merely untidy.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showPassing} onChange={e => setShowPassing(e.target.checked)} />
              Show rules that passed
            </label>
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Severity</Th><Th>Module</Th><Th>Rule</Th><Th right>Found</Th><Th>What it means</Th>
                </tr></thead>
                <tbody>
                  {shown.map(r => (
                    <React.Fragment key={r.id}>
                      <tr className={r.failed_count > 0 ? (r.severity === 'critical' ? 'bg-red-50/50' : 'bg-amber-50/40') : ''}>
                        <Td>{r.failed_count > 0 ? sevBadge(r.severity) : <Badge color="green">Passed</Badge>}</Td>
                        <Td className="text-xs">{r.module}</Td>
                        <Td className="font-medium">{r.title}</Td>
                        <Td right className={r.failed_count > 0 ? 'font-bold text-red-600' : 'text-gray-400'}>
                          {r.failed_count}
                        </Td>
                        <Td className="text-xs text-gray-500">{r.failed_count > 0 ? r.what_it_means : '—'}</Td>
                      </tr>
                      {r.failed_count > 0 && r.detail && (
                        <tr>
                          <Td colSpan={5} className="text-xs text-gray-600 bg-gray-50">
                            <span className="font-semibold text-gray-500">Examples: </span>{r.detail}
                            {r.failed_count > 20 && <span className="text-gray-400"> (first 20 of {r.failed_count})</span>}
                          </Td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {shown.length === 0 && (
                    <tr><Td colSpan={5} className="text-center text-gray-400 py-6">Nothing failing — tick the box to see the rules that passed.</Td></tr>
                  )}
                </tbody>
              </Table>
            </div>
            <p className="text-xs text-gray-500 px-3 py-2 flex items-start gap-1.5">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                These rules only catch what they have been taught. Every fault found from here on is added as a
                new rule in the same session it is fixed, so the app ends up checking itself against every
                mistake it has ever made. Admin only — nobody else can read these results, on this page or by
                asking the database.
              </span>
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

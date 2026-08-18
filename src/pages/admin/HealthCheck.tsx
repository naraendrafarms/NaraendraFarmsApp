import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Button, Badge, Table, Th, Td, EmptyState } from '@/components/ui'
import { RefreshCw, ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
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

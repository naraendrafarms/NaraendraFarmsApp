import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, SectionHeader, Button, Input, Spinner, Table, Th, Td, Badge } from '@/components/ui'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

const PF_CEIL = 15000

function downloadFile(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}
function csv(rows: (string | number)[][]) {
  return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

export const StatutoryFilingPage: React.FC = () => {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['statutory_filing', month],
    enabled: !!month,
    queryFn: async () => {
      const { data, error } = await supabase.from('salary_monthly')
        .select('basic_salary,gross_salary,pf_employee,employer_eps,employer_epf_diff,esi_employee,esi_employer,pt,days_worked,month_days,absent_days,employees!inner(name,emp_id,uan_no,esi_no,restrict_pf,pf_applicable,esi_applicable,pt_applicable)')
        .eq('month', month + '-01')
      if (error) throw error
      return (data ?? []).map((r: any) => {
        const e = r.employees ?? {}
        const basic = Number(r.basic_salary ?? 0)
        const pfWage = e.restrict_pf ? Math.min(basic, PF_CEIL) : basic        // EPF wages
        const epsWage = Math.min(basic, PF_CEIL)                               // EPS/EDLI wages
        const ncp = Math.max(0, Number(r.month_days ?? 0) - Number(r.days_worked ?? 0))
        return {
          name: e.name ?? '', emp_id: e.emp_id ?? '', uan: e.uan_no ?? '', esi_no: e.esi_no ?? '',
          pf_applicable: !!e.pf_applicable, esi_applicable: !!e.esi_applicable, pt_applicable: !!e.pt_applicable,
          gross: Number(r.gross_salary ?? 0), basic, days: Number(r.days_worked ?? 0), ncp,
          pfWage, epsWage,
          ee: Number(r.pf_employee ?? 0), eps: Number(r.employer_eps ?? 0), erDiff: Number(r.employer_epf_diff ?? 0),
          esiEE: Number(r.esi_employee ?? 0), esiER: Number(r.esi_employer ?? 0),
          pt: Number(r.pt ?? 0),
        }
      })
    }
  })

  const pfRows = (rows as any[]).filter(r => r.pf_applicable)
  const esiRows = (rows as any[]).filter(r => r.esi_applicable && r.basic <= 21000)  // ESI on Basic
  const ptRows = (rows as any[]).filter(r => r.pt > 0)

  // EPFO ECR text file: UAN#~#Name#~#Gross#~#EPFWage#~#EPSWage#~#EDLIWage#~#EE#~#EPS#~#ERdiff#~#NCP#~#Refund
  const exportECR = () => {
    if (!pfRows.length) { toast.error('No PF-applicable employees this month'); return }
    const lines = pfRows.map(r => [
      r.uan, r.name, Math.round(r.gross), Math.round(r.pfWage), Math.round(r.epsWage), Math.round(r.epsWage),
      Math.round(r.ee), Math.round(r.eps), Math.round(r.erDiff), r.ncp, 0,
    ].join('#~#'))
    downloadFile(`ECR_${month}.txt`, lines.join('\n'))
    toast.success(`ECR: ${pfRows.length} members`)
  }
  const exportESIC = () => {
    if (!esiRows.length) { toast.error('No ESI-applicable employees this month'); return }
    downloadFile(`ESIC_${month}.csv`, csv([
      ['IP Number', 'IP Name', 'No. of Days', 'Wages (Basic)', 'Employee 0.75%', 'Employer 3.25%'],
      ...esiRows.map(r => [r.esi_no, r.name, r.days, Math.round(r.basic), Math.round(r.esiEE), Math.round(r.esiER)]),
    ]), 'text/csv')
    toast.success(`ESIC: ${esiRows.length} IPs`)
  }
  const exportPT = () => {
    if (!ptRows.length) { toast.error('No PT this month'); return }
    downloadFile(`PT_${month}.csv`, csv([
      ['Emp Code', 'Name', 'PT Amount'],
      ...ptRows.map(r => [r.emp_id, r.name, Math.round(r.pt)]),
    ]), 'text/csv')
    toast.success(`PT: ${ptRows.length} employees`)
  }

  const t = (arr: any[], k: string) => arr.reduce((s, r) => s + (r[k] || 0), 0)

  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="Statutory Filing (PF / ESI / PT)" subtitle="Pick a month and download upload-ready files." />
      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <Input label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-48" />
        <Button variant="outline" icon={<Download size={14} />} onClick={exportECR}>PF ECR (.txt)</Button>
        <Button variant="outline" icon={<Download size={14} />} onClick={exportESIC}>ESIC (.csv)</Button>
        <Button variant="outline" icon={<Download size={14} />} onClick={exportPT}>PT (.csv)</Button>
      </Card>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-purple-700">PF (ECR) — {pfRows.length} members</div>
            <Table>
              <thead><tr><Th>UAN / Name</Th><Th right>EE 12%</Th><Th right>EPS</Th><Th right>ER 3.67%</Th></tr></thead>
              <tbody>
                {pfRows.map((r, i) => (
                  <tr key={i}><Td className="text-xs">{r.uan || '⚠ no UAN'}<div className="text-[10px] text-gray-400">{r.name} · NCP {r.ncp}</div></Td>
                    <Td right className="text-xs">{inr(r.ee)}</Td><Td right className="text-xs">{inr(r.eps)}</Td><Td right className="text-xs">{inr(r.erDiff)}</Td></tr>
                ))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(pfRows,'ee'))}</Td><Td right>{inr(t(pfRows,'eps'))}</Td><Td right>{inr(t(pfRows,'erDiff'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-blue-700">ESIC — {esiRows.length} IPs</div>
            <Table>
              <thead><tr><Th>IP / Name</Th><Th right>Wages (Basic)</Th><Th right>EE</Th><Th right>ER</Th></tr></thead>
              <tbody>
                {esiRows.map((r, i) => (
                  <tr key={i}><Td className="text-xs">{r.esi_no || '⚠ no IP'}<div className="text-[10px] text-gray-400">{r.name} · {r.days}d</div></Td>
                    <Td right className="text-xs">{inr(r.basic)}</Td><Td right className="text-xs">{inr(r.esiEE)}</Td><Td right className="text-xs">{inr(r.esiER)}</Td></tr>
                ))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(esiRows,'basic'))}</Td><Td right>{inr(t(esiRows,'esiEE'))}</Td><Td right>{inr(t(esiRows,'esiER'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-orange-700">PT — {ptRows.length} employees</div>
            <Table>
              <thead><tr><Th>Name</Th><Th right>PT</Th></tr></thead>
              <tbody>
                {ptRows.map((r, i) => (<tr key={i}><Td className="text-xs">{r.emp_id ? r.emp_id + ' — ' : ''}{r.name}</Td><Td right className="text-xs">{inr(r.pt)}</Td></tr>))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(ptRows,'pt'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
        </div>
      )}
      <p className="text-xs text-gray-400">Rows with ⚠ are missing UAN / IP number — add them in Employees so the upload file is valid. ECR uses the ₹15,000 EPS/EDLI ceiling; PF wage respects each employee's Restrict PF.</p>
    </div>
  )
}

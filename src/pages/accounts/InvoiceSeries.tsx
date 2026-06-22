import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, SectionHeader, Spinner, Table, Th, Td, Button, Input, Modal } from '@/components/ui'
import { Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const InvoiceSeriesPage: React.FC = () => {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any>(null)
  const [val, setVal] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoice_series'],
    queryFn: async () => {
      const { data } = await supabase.from('invoice_series').select('*').order('code')
      return data ?? []
    },
  })

  const mut = useMutation({
    mutationFn: async () => {
      const n = parseInt(val)
      if (isNaN(n) || n < 0) throw new Error('Enter a valid number')
      const { error } = await supabase.from('invoice_series').update({ current_no: n }).eq('code', editing.code)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Counter updated')
      qc.invalidateQueries({ queryKey: ['invoice_series'] })
      setEditing(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const open = (row: any) => { setEditing(row); setVal(row.current_no?.toString() ?? '0') }

  // Build an invoice number from the template: replace {FY} and {N}
  const buildNo = (row: any, n: number) =>
    (row.template ?? `${row.code}/{N}`)
      .replace('{FY}', row.fy ?? '')
      .replace('{N}', String(n).padStart(row.pad ?? 0, '0'))

  return (
    <>
      <SectionHeader
        title="Invoice Series"
        subtitle="Manage invoice number counters for each series. Next invoice = current_no + 1."
      />
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Code</Th><Th>Description</Th><Th>FY</Th>
              <Th right>Current No</Th><Th right>Next Invoice</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(data ?? []).map((r: any) => (
                <tr key={r.code} className="hover:bg-gray-50">
                  <Td><span className="font-mono font-bold text-brand-700">{r.code}</span></Td>
                  <Td>{r.label ?? '—'}</Td>
                  <Td className="text-xs">{r.fy ?? '—'}</Td>
                  <Td right>{r.current_no}</Td>
                  <Td right className="font-semibold text-green-700">{buildNo(r, r.current_no + 1)}</Td>
                  <Td>
                    <button onClick={() => open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                      <Edit2 size={13} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Counter — ${editing?.code}`} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Update</Button>
        </>}>
        <p className="text-sm text-gray-600 mb-4">
          Set <strong>current_no</strong> — the next invoice generated will be <strong>{editing ? buildNo(editing, parseInt(val || '0') + 1) : ''}</strong>.
        </p>
        <Input label="Current No (last used)" type="number" value={val} onChange={e => setVal(e.target.value)} hint="Next invoice = this value + 1" />
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 mt-3">
          Only change this to fix a counter that got ahead of actual invoices. Do not set it below the last real invoice number.
        </p>
      </Modal>
    </>
  )
}

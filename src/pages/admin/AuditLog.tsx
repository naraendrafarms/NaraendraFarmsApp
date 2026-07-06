import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDateTime } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Badge , DateInput } from '@/components/ui'
import { Shield, Search, RefreshCw, Download, User, Clock } from 'lucide-react'

const TABLE_LABELS: Record<string, string> = {
  daily_records:       'Daily Records',
  flock_transfers:     'Flock Transfers',
  nhe_sales:           'NHE / Bird Sales',
  salary_monthly:      'Salary',
  attendance_daily:    'Attendance',
  grn:                 'GRN / Purchases',
  electricity_bills:   'Electricity Bills',
  flocks:              'Flocks',
  employees:           'Employees',
  purchase_orders:     'Purchase Orders',
  pending_payments:    'Payments',
  cash_book:           'Cash Book',
  farm_expenses:       'Farm Expenses',
  vaccination_records: 'Vaccinations',
  daily_feed:          'Feed Records',
  employee_advances:   'Employee Advances',
  vhl_daily_entry:     'VHL Daily Entry',
  vhl_medicines:       'VHL Medicines',
  vhl_medicine_usage:  'VHL Medicine Usage',
  vhl_egg_rate_history:'VHL Egg Rate History',
  vhl_egg_production:  'VHL Egg Production',
  bag_sales:            'Empty Bags',
  feed_production:      'Feed Production',
  medicine_usage:        'Medicine Usage',
  medicine_purchases:    'Medicine Purchases',
  hatch_batches:         'Hatch Batches',
  bonus:                 'Bonus',
  partners:              'Partners',
  statutory_liabilities: 'Statutory Liabilities',
  generator_diesel_purchases: 'Diesel Purchases',
  generator_maintenance_log:  'Generator Maintenance',
  supplier_invoices:     'Supplier Invoices',
  feed_transfers:        'Feed Transfers',
  egg_conversions:       'Egg Conversions',
  egg_opening_stock:     'Egg Opening Stock',
  shed_transfers:        'Shed Transfers',
  bank_transactions:     'Bank Ledger',
  parties:               'Suppliers / Parties',
  employee_deductions:   'Employee Deductions',
  generators:            'Generators',
  generator_usage_log:   'Generator Usage',
  feedmill_expenses:     'Feed Mill Expenses',
  po_receipts:           'PO Receipts',
  hatchery_advances:     'Hatchery Advances',
  vendor_bank_details:   'Vendor Bank Details',
  company_settings:      'Company Settings',
}

const ACTION_COLOR: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
}

const fmtDT = (ts: string) => fmtDateTime(ts)

export const AuditLogPage: React.FC = () => {
  const [search, setSearch]       = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter]   = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 100

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit_log', tableFilter, actionFilter, userFilter, fromDate, toDate, page],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('changed_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (tableFilter)  q = q.eq('table_name', tableFilter)
      if (actionFilter) q = q.eq('action', actionFilter)
      if (userFilter)   q = q.ilike('user_email', `%${userFilter}%`)
      if (fromDate)     q = q.gte('changed_at', fromDate + 'T00:00:00')
      if (toDate)       q = q.lte('changed_at', toDate + 'T23:59:59')

      const { data, count, error } = await q
      if (error) throw error
      return { rows: data ?? [], total: count ?? 0 }
    }
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0

  // Client-side search on summary/email
  const filtered = search
    ? rows.filter(r =>
        r.summary?.toLowerCase().includes(search.toLowerCase()) ||
        r.user_email?.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  const handleExport = () => {
    const hdrs = 'Timestamp,User,Action,Table,Summary,Record ID'
    const lines = filtered.map(r => [
      fmtDT(r.changed_at),
      r.user_email ?? '—',
      r.action,
      TABLE_LABELS[r.table_name] ?? r.table_name,
      (r.summary ?? '').replace(/,/g, ';'),
      r.record_id ?? '',
    ].join(','))
    const blob = new Blob([hdrs + '\n' + lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  // Unique users in current result for quick filter
  const uniqueUsers = [...new Set(rows.map(r => r.user_email).filter(Boolean))]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Audit Log"
        subtitle="Every data entry, edit and deletion — who did it and when"
        action={
          <div className="flex gap-2">
            <button onClick={() => refetch()}
              className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${isFetching ? 'animate-spin text-brand-500' : 'text-gray-500'}`}>
              <RefreshCw size={15}/>
            </button>
            <button onClick={handleExport}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              <Download size={15}/>
            </button>
          </div>
        }
      />

      {total === 0 && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>Audit log is empty.</strong> It records all data changes from the time it was enabled (17-Jun-2026 onwards).
          Try creating or editing any record — it will appear here instantly.
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user or description…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Table filter */}
          <select value={tableFilter} onChange={e => { setTableFilter(e.target.value); setPage(0) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Modules</option>
            {Object.entries(TABLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {/* Action filter */}
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Actions</option>
            <option value="INSERT">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
          </select>

          {/* User filter */}
          <select value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(0) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Users</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Date range */}
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            From <DateInput value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0) }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            To <DateInput value={toDate} onChange={e => { setToDate(e.target.value); setPage(0) }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          </label>

          {(tableFilter || actionFilter || userFilter || fromDate || toDate || search) && (
            <button onClick={() => { setTableFilter(''); setActionFilter(''); setUserFilter(''); setFromDate(''); setToDate(''); setSearch(''); setPage(0) }}
              className="text-sm text-red-500 hover:underline">Clear all</button>
          )}
        </div>
      </Card>

      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total entries', value: total.toLocaleString('en-IN'), color: 'text-gray-700' },
          { label: 'Created', value: rows.filter(r=>r.action==='INSERT').length, color: 'text-green-600' },
          { label: 'Updated', value: rows.filter(r=>r.action==='UPDATE').length, color: 'text-blue-600' },
          { label: 'Deleted', value: rows.filter(r=>r.action==='DELETE').length, color: 'text-red-600' },
          { label: 'Unique users', value: uniqueUsers.length, color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label} className="!p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Log table */}
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                    <div className="flex items-center gap-1"><Clock size={12}/> Timestamp</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center gap-1"><User size={12}/> User</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <Shield size={32} className="mx-auto mb-2 opacity-30"/>
                    No audit records found
                  </td></tr>
                )}
                {filtered.map(row => (
                  <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row.action === 'DELETE' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {fmtDT(row.changed_at)}
                    </td>
                    <td className="px-4 py-3">
                      {row.user_email ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {row.user_email[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700 truncate max-w-[160px]">{row.user_email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">System / Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[row.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.action === 'INSERT' ? 'Created' : row.action === 'UPDATE' ? 'Updated' : 'Deleted'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                        {TABLE_LABELS[row.table_name] ?? row.table_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {row.summary ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString('en-IN')} entries
              </p>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white">
                  ← Previous
                </button>
                <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white">
                  Next →
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

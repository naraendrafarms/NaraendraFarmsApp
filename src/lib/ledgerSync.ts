import { supabase } from '@/lib/supabase'

// ── Single shared ledger sync — every page/action that marks a vendor bill
// Paid/Unpaid goes through these two functions, so Cash Book always reflects
// what happened here regardless of which action (Pay / Edit / Bank Link) did it.
// cash_book.payment_mode allows 'cash' | 'upi' | 'cheque' | 'neft' | 'rtgs' | 'imps' | 'bank_transfer'.
export const toCbMode = (mode: string) => {
  const m = (mode || '').toLowerCase()
  if (m === 'bank transfer') return 'bank_transfer'
  return ['cash', 'upi', 'neft', 'rtgs', 'imps'].includes(m) ? m : 'cheque'
}

export const postLedgerEntry = async (opts: {
  paymentId: string; vendorName: string; invoiceNo?: string | null; grnNo?: string | null
  amount: number; mode: string; date: string; ref?: string | null; remarks?: string | null
  bankAccountId?: string | null; partyId?: string | null
}) => {
  if (opts.amount <= 0) return
  // Settling a bill against a vendor advance, or against an opening balance, is
  // NOT a cash movement: the money left when the advance was paid (or predates
  // the books entirely). The Pay modal has always known this and skipped
  // posting for those modes, but the Edit form called this unconditionally — so
  // re-saving an advance-settled bill invented a Cash Book payment for money
  // that never moved. Enforced here so every caller gets it right.
  const settledEarlier = ['advance', 'opening adjustment']
    .includes((opts.mode || '').trim().toLowerCase())
  if (settledEarlier) return
  await supabase.from('cash_book').insert({
    txn_date: opts.date,
    txn_type: 'payment',
    category: 'purchase_payment',
    description: `Payment to ${opts.vendorName}${opts.invoiceNo ? ' — Inv ' + opts.invoiceNo : ''}${opts.grnNo ? ' / GRN ' + opts.grnNo : ''}`,
    party_name: opts.vendorName,
    reference_no: opts.ref || null,
    amount_in: 0,
    amount_out: opts.amount,
    payment_mode: toCbMode(opts.mode),
    pending_payment_id: opts.paymentId,
    remarks: opts.remarks || null,
  })
  // Non-cash payments also post to the specific bank account's ledger (in
  // addition to Cash Book, which stays the combined master ledger as
  // before) — otherwise that account's Bank Ledger never reflects vendor
  // payments made from it.
  if (opts.mode.toLowerCase() !== 'cash' && opts.bankAccountId) {
    await supabase.from('bank_transactions').insert({
      bank_account_id: opts.bankAccountId,
      txn_date: opts.date,
      txn_type: 'Debit',
      category: 'Vendor Payment',
      reference_no: opts.ref || null,
      description: `Payment to ${opts.vendorName}${opts.invoiceNo ? ' — Inv ' + opts.invoiceNo : ''}${opts.grnNo ? ' / GRN ' + opts.grnNo : ''}`,
      amount: opts.amount,
      party_id: opts.partyId || null,
      linked_payment_id: opts.paymentId,
    })
  }
}

export const clearLedgerEntries = async (paymentId: string) => {
  await supabase.from('cash_book').delete().eq('pending_payment_id', paymentId)
  await supabase.from('bank_transactions').delete().eq('linked_payment_id', paymentId)
}

// ── Reverse sync: bill payment → Purchase Invoice Register ────────────────
// Purchase Invoice Register mirrors every invoice INTO pending_payments
// (keyed on vendor_name + invoice_no), but nothing ever mirrored back — so
// paying a bill from Pending Payments / Bulk Pay / Bank Ledger left the
// invoice still showing Unpaid in the register forever. Every place that
// changes a bill's paid amount calls this so both views agree.
//
// Matching mirrors how InvoiceRegister derives the vendor name for its own
// upsert (party name first, else the free-text supplier_name), so a bill
// created from an invoice always finds its way back to that same invoice.
export const syncSupplierInvoicePayment = async (opts: {
  invoiceNo?: string | null
  vendorName?: string | null
  partyId?: string | null
  paidAmount: number
  tdsAmount?: number | null
  discountAmount?: number | null
}) => {
  const invNo = (opts.invoiceNo ?? '').trim()
  if (!invNo) return
  const { data: rows } = await supabase.from('supplier_invoices')
    .select('id,total_amount,supplier_name,party_id')
    .eq('invoice_no', invNo)
  if (!rows?.length) return
  // Invoice numbers are only unique per vendor, so never update on the
  // number alone — require the party or the supplier name to line up too.
  const match = rows.find((r: any) => opts.partyId && r.party_id === opts.partyId)
    ?? rows.find((r: any) => opts.vendorName && (r.supplier_name ?? '').trim().toLowerCase() === opts.vendorName.trim().toLowerCase())
  if (!match) return
  const total = Number(match.total_amount) || 0
  const paid = Math.max(0, opts.paidAmount)
  const tds = Math.max(0, Number(opts.tdsAmount) || 0)
  const disc = Math.max(0, Number(opts.discountAmount) || 0)
  // TDS and discount settle the invoice without cash changing hands, so they
  // count toward "is this invoice cleared" — otherwise a ₹79,000 invoice with
  // ₹7,900 TDS looked ₹7,900 short forever after paying the ₹71,100 due.
  const settled = paid + tds + disc
  const status = total > 0 && settled >= total - 0.5 ? 'paid' : settled > 0 ? 'partial' : 'unpaid'
  await supabase.from('supplier_invoices')
    .update({ paid_amount: paid, tds_amount: tds, payment_status: status }).eq('id', match.id)
}

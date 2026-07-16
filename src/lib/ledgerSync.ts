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

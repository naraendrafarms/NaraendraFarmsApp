import { supabase } from '@/lib/supabase'
import { friendlyDbError } from '@/lib/utils'

// One implementation of an internal transfer, shared by the Cash Book and the
// Imprest Ledger. Written once on purpose: this is a PAIRED write across two
// tables, and two copies of it would eventually disagree about how a leg is
// shaped -- which is exactly the kind of drift that leaves a book unbalanced.
//
// An endpoint is an imprest, a bank account, or a site:
//   'imprest:<uuid>'  -> a leg in cash_book carrying cash_account_id
//   'bank:<uuid>'     -> a leg in bank_transactions
//   'site:<uuid>' or 'site:ho' -> a leg in cash_book carrying farm_id
//
// Imprest-to-bank (a deposit) and bank-to-imprest (cash drawn) were impossible
// before this existed, because cash_book and bank_transactions are separate
// tables with nothing crossing between them.
//
// Both legs share one transfer_group_id, so a transfer can be found as one
// movement and a half-deleted one is detectable. The previous site-to-site
// transfer wrote two loose rows with nothing linking them, so deleting one
// silently unbalanced the book.

export type TransferEndpoint = string

export interface TransferInput {
  date: string
  amount: number
  description: string
  from: TransferEndpoint
  to: TransferEndpoint
}

const parseEndpoint = (v: string) => {
  const [kind, id] = v.split(':')
  return { kind, id: id === 'ho' ? null : id }
}

export function validateTransfer(t: TransferInput): string | null {
  if (!t.amount || t.amount <= 0) return 'Enter a valid amount'
  if (!t.from || !t.to) return 'Choose both From and To'
  if (t.from === t.to) return 'From and To must differ'
  if (!t.description?.trim()) return 'Enter a description'
  return null
}

export async function recordTransfer(t: TransferInput): Promise<void> {
  const problem = validateTransfer(t)
  if (problem) throw new Error(problem)

  const groupId = crypto.randomUUID()
  const src = parseEndpoint(t.from)
  const dst = parseEndpoint(t.to)
  const amt = t.amount
  const desc = t.description.trim()

  // The imprest on the OTHER side of a bank leg, so a deposit row can name its
  // source without having to read the paired row.
  const otherImprest = (other: { kind: string; id: string | null }) =>
    other.kind === 'imprest' ? other.id : null

  const cashLeg = (side: { kind: string; id: string | null }, isOut: boolean) => ({
    txn_date: t.date, txn_type: 'contra', category: 'transfer',
    description: desc,
    farm_id: side.kind === 'site' ? side.id : null,
    cash_account_id: side.kind === 'imprest' ? side.id : null,
    amount_in: isOut ? 0 : amt,
    amount_out: isOut ? amt : 0,
    payment_mode: 'cash',
    transfer_group_id: groupId,
  })

  const bankLeg = (
    side: { kind: string; id: string | null },
    other: { kind: string; id: string | null },
    isOut: boolean,
  ) => ({
    bank_account_id: side.id,
    txn_date: t.date,
    // Money INTO the bank is a Credit; money out of it is a Debit.
    txn_type: isOut ? 'Debit' : 'Credit',
    category: 'transfer',
    description: desc,
    amount: amt,
    cash_account_id: otherImprest(other),
    transfer_group_id: groupId,
  })

  const cashRows: any[] = []
  const bankRows: any[] = []
  if (src.kind === 'bank') bankRows.push(bankLeg(src, dst, true))
  else cashRows.push(cashLeg(src, true))
  if (dst.kind === 'bank') bankRows.push(bankLeg(dst, src, false))
  else cashRows.push(cashLeg(dst, false))

  if (cashRows.length) {
    const { error } = await supabase.from('cash_book').insert(cashRows)
    if (error) throw new Error(friendlyDbError(error))
  }
  if (bankRows.length) {
    const { error } = await supabase.from('bank_transactions').insert(bankRows)
    if (error) throw new Error(friendlyDbError(error))
  }
}

// Every query either screen should refresh after a transfer. Kept here so a
// new screen cannot forget one and leave a stale balance on the page.
export const TRANSFER_QUERY_KEYS = [
  'cash_book', 'cash_account_balances', 'imprest_ledger', 'imprest_prior', 'bank_transactions',
]

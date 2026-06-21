// GST helpers — GSTIN parsing, supply-type detection, tax splitting.
// Our company is in Telangana (state code 36).

export const OUR_STATE_CODE = '36'
export const OUR_GSTIN = '36ABJFM1393C1ZC'

// GST state codes (India) — code → state name
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra', '28': 'Andhra Pradesh (Old)', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory',
}

// GSTIN format: 2 digit state + 10 char PAN + 1 entity + Z + 1 checksum = 15 chars
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export interface GstinParts {
  valid: boolean
  stateCode: string
  stateName: string
  pan: string
}

export function parseGstin(raw: string): GstinParts {
  const gstin = (raw || '').trim().toUpperCase()
  const valid = GSTIN_RE.test(gstin)
  const stateCode = gstin.slice(0, 2)
  return {
    valid,
    stateCode: /^[0-9]{2}$/.test(stateCode) ? stateCode : '',
    stateName: GST_STATE_CODES[stateCode] || '',
    pan: gstin.length >= 12 ? gstin.slice(2, 12) : '',
  }
}

// intra-state (CGST+SGST) when both parties in same state, else inter-state (IGST)
export function supplyType(partyStateCode?: string | null): 'intra' | 'inter' {
  if (!partyStateCode) return 'intra' // unregistered/local default
  return partyStateCode === OUR_STATE_CODE ? 'intra' : 'inter'
}

export interface TaxSplit {
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total: number      // tax only
  grand: number      // taxable + tax
}

// Split GST on a taxable value at a given rate %
export function splitTax(taxableValue: number, ratePct: number, type: 'intra' | 'inter'): TaxSplit {
  const taxable = Math.round((taxableValue || 0) * 100) / 100
  const taxAmt = Math.round(taxable * (ratePct || 0)) / 100
  let cgst = 0, sgst = 0, igst = 0
  if (type === 'inter') {
    igst = taxAmt
  } else {
    cgst = Math.round((taxAmt / 2) * 100) / 100
    sgst = taxAmt - cgst
  }
  return { taxable, cgst, sgst, igst, total: taxAmt, grand: taxable + taxAmt }
}

export const GST_RATE_OPTIONS = [
  { value: '0', label: '0% (Nil / Exempt)' },
  { value: '5', label: '5%' },
  { value: '18', label: '18%' },
]

export const GST_TYPE_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'unregistered', label: 'Unregistered' },
  { value: 'composition', label: 'Composition' },
]

export const PURCHASE_NATURE_OPTIONS = [
  { value: 'purchase', label: 'Purchase (Stock/Raw Material)' },
  { value: 'expense', label: 'Expense' },
  { value: 'asset', label: 'Capital Asset' },
]

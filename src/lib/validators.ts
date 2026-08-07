// Bank detail sanity checks. IFSC has a fixed, published format (RBI); account
// numbers do not — every bank picks its own length (9–18 digits in practice),
// so this can only be a loose range check, not an exact rule.

export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test((ifsc || '').trim().toUpperCase())
}

export function isValidAccountNo(acc: string): boolean {
  const v = (acc || '').trim()
  return /^\d{9,18}$/.test(v)
}

export function ifscError(ifsc: string): string | null {
  if (!ifsc || !ifsc.trim()) return null
  return isValidIFSC(ifsc) ? null : 'IFSC must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)'
}

export function accountNoError(acc: string): string | null {
  if (!acc || !acc.trim()) return null
  return isValidAccountNo(acc) ? null : 'Account number should be 9–18 digits, numbers only'
}

// Aadhaar is 12 digits and never starts with 0 or 1. Spaces are ignored so a
// number can be typed in the 4-4-4 grouping it is printed in.
//
// Deliberately a length/prefix check only, and a warning rather than a block:
// the real number carries a Verhoeff checksum, but rejecting a save on a
// checksum would risk refusing a legitimate card over a transcription quirk and
// losing the rest of the form. Catching the common typo is the useful part.
export function isValidAadhaar(aadhaar: string): boolean {
  return /^[2-9]\d{11}$/.test((aadhaar || '').replace(/\s/g, ''))
}

export function aadhaarError(aadhaar: string): string | null {
  if (!aadhaar || !aadhaar.trim()) return null
  const digits = aadhaar.replace(/\s/g, '')
  if (!/^\d+$/.test(digits)) return 'Aadhaar should contain numbers only'
  if (digits.length !== 12) return `Aadhaar must be 12 digits (you have entered ${digits.length})`
  return isValidAadhaar(digits) ? null : 'Aadhaar cannot start with 0 or 1'
}

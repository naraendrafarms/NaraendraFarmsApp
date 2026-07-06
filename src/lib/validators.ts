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

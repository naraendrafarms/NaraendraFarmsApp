// What a line actually holds, taken from the box split the owner's sheet gives:
// on Agraharam sheds 1-2, lines 6/7/10/11 of sides B and C are male-only, while
// the same lines on sheds 3-4 carry both. It was stored but never labelled, so
// nobody entering a day could see which line was which.
export const lineSex = (l: any): 'F' | 'M' | 'F+M' | null => {
  const f = l?.boxes_female, m = l?.boxes_male
  if (f == null && m == null) return null
  if ((f ?? 0) > 0 && (m ?? 0) > 0) return 'F+M'
  if ((m ?? 0) > 0) return 'M'
  if ((f ?? 0) > 0) return 'F'
  return null
}

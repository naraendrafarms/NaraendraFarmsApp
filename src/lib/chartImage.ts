// Turns an on-screen chart into an image for printing.
//
// The charts are Recharts, which draws real SVG into the page. Rather than
// re-drawing the chart a second time for the printout — where it could quietly
// disagree with what was reviewed on screen — the rendered SVG itself is
// serialised and embedded. What prints IS what was seen.
//
// Encoded via encodeURIComponent rather than base64: an SVG data URI carries
// arbitrary text (axis labels, flock names) and btoa throws on any character
// outside Latin-1, which a flock or site name can easily contain.

/**
 * Serialise the first <svg> inside `el` to a data URI suitable for <img src>.
 * Returns null when there is no chart to capture (data still loading, or the
 * panel is empty) so callers can simply omit that section.
 */
export function chartToDataUri(el: HTMLElement | null): string | null {
  if (!el) return null
  const svg = el.querySelector('svg')
  if (!svg) return null

  // Clone so nothing on screen is disturbed by the attributes added below.
  const clone = svg.cloneNode(true) as SVGSVGElement

  // A printed <img> needs intrinsic dimensions; Recharts sizes its SVG through
  // CSS/attributes that may not survive serialisation, so pin them explicitly
  // and add a viewBox to keep the aspect ratio when the print scales it down.
  const rect = svg.getBoundingClientRect()
  const w = Math.round(rect.width) || 900
  const h = Math.round(rect.height) || 320
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${w} ${h}`)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // Printed on white paper: a transparent chart on a dark preview would vanish.
  clone.style.background = '#ffffff'

  const xml = new XMLSerializer().serializeToString(clone)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
}

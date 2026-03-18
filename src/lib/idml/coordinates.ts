/**
 * VCS (Virtual Coordinate System) → InDesign point conversion.
 *
 * VCS canvas:  800 × 1100 design units
 * InDesign:    612 × 792 points  (8.5″ × 11″ US Letter)
 *
 * IDML spread origin sits at the spine (center-left edge of a single page).
 * For a single-page spread the page occupies x ∈ [0, 612].
 * Geometric bounds use [top, left, bottom, right] in points.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const VCS_WIDTH = 800
export const VCS_HEIGHT = 1100

export const PAGE_WIDTH_PT = 612   // 8.5 inches
export const PAGE_HEIGHT_PT = 792  // 11 inches

export const SCALE_X = PAGE_WIDTH_PT / VCS_WIDTH   // 0.765
export const SCALE_Y = PAGE_HEIGHT_PT / VCS_HEIGHT  // 0.72

// Landscape / centerfold variant
export const VCS_WIDTH_LANDSCAPE = 1600
export const VCS_HEIGHT_LANDSCAPE = 800
export const PAGE_WIDTH_LANDSCAPE_PT = 1224  // 17 inches (tabloid)
export const PAGE_HEIGHT_LANDSCAPE_PT = 792  // 11 inches

// ── Conversion helpers ───────────────────────────────────────────────────────

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Convert a VCS rect to InDesign geometric bounds [top, left, bottom, right] in points. */
export function vcsToGeoBounds(
  rect: Rect,
  landscape = false,
): [number, number, number, number] {
  const sx = landscape
    ? PAGE_WIDTH_LANDSCAPE_PT / VCS_WIDTH_LANDSCAPE
    : SCALE_X
  const sy = landscape
    ? PAGE_HEIGHT_LANDSCAPE_PT / VCS_HEIGHT_LANDSCAPE
    : SCALE_Y

  const top = rect.y * sy
  const left = rect.x * sx
  const bottom = (rect.y + rect.height) * sy
  const right = (rect.x + rect.width) * sx

  return [top, left, bottom, right]
}

/** Build an IDML ItemTransform string (identity matrix + translation). */
export function itemTransform(x: number, y: number): string {
  return `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
}

/** Convert a VCS rect to a PathPointArray (clockwise rectangle in points). */
export function vcsToPathPoints(rect: Rect, landscape = false): string {
  const [top, left, bottom, right] = vcsToGeoBounds(rect, landscape)
  // PathPointType: Anchor, LeftDirection, RightDirection (all same for straight lines)
  return [
    ppType(left, top),
    ppType(right, top),
    ppType(right, bottom),
    ppType(left, bottom),
  ].join(' ')
}

function ppType(x: number, y: number): string {
  const pt = `${x.toFixed(2)} ${y.toFixed(2)}`
  return `<PathPointType Anchor="${pt}" LeftDirection="${pt}" RightDirection="${pt}" />`
}

/** Page dimensions in points for IDML page geometry. */
export function pageDimensions(landscape = false) {
  return {
    width: landscape ? PAGE_WIDTH_LANDSCAPE_PT : PAGE_WIDTH_PT,
    height: landscape ? PAGE_HEIGHT_LANDSCAPE_PT : PAGE_HEIGHT_PT,
  }
}

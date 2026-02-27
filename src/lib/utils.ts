import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clampToCanvas(
  x: number, y: number, w: number, h: number,
  canvasW: number, canvasH: number
) {
  return {
    x: Math.max(0, Math.min(x, canvasW - w)),
    y: Math.max(0, Math.min(y, canvasH - h)),
    width: Math.min(w, canvasW),
    height: Math.min(h, canvasH)
  }
}

export function snapToZone(
  dropX: number, dropY: number,
  zones: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  threshold = 40
): string | null {
  for (const zone of zones) {
    const centerX = zone.x + zone.width / 2
    const centerY = zone.y + zone.height / 2
    const dist = Math.sqrt((dropX - centerX) ** 2 + (dropY - centerY) ** 2)
    if (dist < threshold) return zone.id
  }
  return null
}

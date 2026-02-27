'use client'
import React from 'react'
import { PlacedBlock, StampType } from '@/types'
import { STAMP_CONFIG } from './StampBadge'
import { PriceCalloutCircle } from './PriceCalloutCircle'

interface Props {
  placedBlock: PlacedBlock
  scale: number
  isSelected?: boolean
  onSelect?: () => void
  mode?: 'edit' | 'preview' | 'readonly'
}

export function OverlayRenderer({ placedBlock, scale, isSelected, onSelect, mode = 'edit' }: Props) {
  const overrides   = placedBlock.overrides || {}
  const feed        = placedBlock.blockData?.feedJson
  const displayMode = overrides.displayMode as string

  const stampColorMap = (overrides.stampColors as Partial<Record<StampType, string>>)                      || {}
  const stampShapeMap = (overrides.stampShapes as Partial<Record<StampType, 'circle' | 'square' | 'pill'>>) || {}
  const stampTextMap  = (overrides.stampTexts  as Partial<Record<StampType, string>>)                      || {}

  const selectionRing = isSelected && mode === 'edit' ? (
    <div style={{
      position: 'absolute', inset: 0,
      border: '2px solid #1565C0', borderRadius: 4,
      pointerEvents: 'none', zIndex: 100,
    }} />
  ) : null

  // ── Stamp Overlay — entire block is a single large badge ──────────────────
  if (displayMode === 'stamp_overlay') {
    const stamps    = (overrides.stamps as StampType[]) || feed?.stamps || []
    const stampType = stamps[0] || 'SALE'
    const config    = STAMP_CONFIG[stampType] || STAMP_CONFIG['SALE']

    const stampBgColor = stampColorMap[stampType] ?? config.bg
    const stampShape   = stampShapeMap[stampType]
    const stampText    = stampTextMap[stampType] ?? (
      stampType === 'PCT_OFF' && feed?.price?.percentOff
        ? `${feed.price.percentOff}%\nOFF`
        : config.text
    )
    const lines    = stampText.split('\n')
    const badgeD   = Math.min(placedBlock.width, placedBlock.height) * scale * 0.85
    const fontSize = Math.max(7, badgeD * 0.2)

    const stampRadius = stampShape === 'circle' ? '50%'
      : stampShape === 'pill'   ? 999
      : stampShape === 'square' ? Math.max(4, badgeD * 0.06)
      : (config.shape === 'circle' || config.shape === 'burst') ? '50%'
      : Math.max(4, badgeD * 0.06)

    return (
      <div
        onClick={onSelect}
        style={{
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: mode === 'edit' ? 'grab' : 'default',
          userSelect: 'none', borderRadius: 4,
          outline: isSelected && mode === 'edit' ? '2px solid #1565C0' : 'none',
          outlineOffset: 2,
        }}
      >
        <div style={{
          width: badgeD, height: badgeD, borderRadius: stampRadius,
          backgroundColor: stampBgColor,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 12px rgba(0,0,0,0.35)',
          border: `${Math.max(2, badgeD * 0.04)}px solid rgba(255,255,255,0.55)`,
          padding: badgeD * 0.06,
        }}>
          {lines.map((line, i) => (
            <span key={i} style={{
              color: '#fff', fontSize, fontWeight: 900,
              textTransform: 'uppercase', lineHeight: 1.15,
              textAlign: 'center', letterSpacing: '0.02em',
            }}>
              {line}
            </span>
          ))}
        </div>
        {selectionRing}
      </div>
    )
  }

  // ── Sale Band — full-width promotional banner ─────────────────────────────
  if (displayMode === 'sale_band') {
    const bandBg      = (overrides.backgroundColor as string) || '#C8102E'
    const headline    = (overrides.headline    as string) || feed?.headline    || ''
    const description = (overrides.description as string) || feed?.description || ''
    const disclaimer  = (overrides.disclaimer  as string) || feed?.disclaimer  || ''
    const promoPrice  = (overrides.priceText   as string) || (feed as Record<string, unknown>)?.priceText as string | undefined
    const hasPrice    = !!feed?.price || !!feed?.upc
    const circleRingColor = (overrides.priceCircleRingColor as string) || 'rgba(255,255,255,0.8)'
    const circleBgColor   = (overrides.priceCircleBackground as string) || 'rgba(255,255,255,0.95)'
    const circleSize = Math.min(
      placedBlock.height * scale * 0.72,
      placedBlock.width  * scale * 0.32,
      90
    )

    return (
      <div
        onClick={onSelect}
        style={{
          width: '100%', height: '100%',
          borderRadius: 4, overflow: 'hidden', position: 'relative',
          cursor: mode === 'edit' ? 'grab' : 'default',
          userSelect: 'none',
          boxShadow: isSelected
            ? '0 0 0 2px #1565C0, 0 4px 16px rgba(0,0,0,0.2)'
            : '0 2px 8px rgba(0,0,0,0.12)',
          backgroundColor: bandBg,
          display: 'flex', alignItems: 'center',
          gap: Math.max(6, 10 * scale),
          padding: `${Math.max(6, 8 * scale)}px ${Math.max(8, 12 * scale)}px`,
        }}
      >
        {/* Left: price circle */}
        {promoPrice ? (
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: `${Math.max(2, circleSize * 0.04)}px dashed rgba(255,255,255,0.8)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{
              fontWeight: 900,
              fontSize: (overrides.priceFontSize as number) ?? Math.max(14, circleSize * 0.38),
              fontFamily: (overrides.priceFontFamily as string) || 'inherit',
              color: '#111', lineHeight: 1,
            }}>
              {promoPrice}
            </span>
          </div>
        ) : hasPrice && feed ? (
          <PriceCalloutCircle
            upc={feed.upc}
            fallbackPrice={feed.price}
            size={circleSize}
            ringColor={circleRingColor}
            bgColor={circleBgColor}
          />
        ) : null}

        {/* Right: text */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {headline && (
            <div style={{
              fontSize: Math.max(9, 14 * scale), fontWeight: 900, color: '#fff',
              lineHeight: 1.15, marginBottom: 2,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {headline}
            </div>
          )}
          {description && (
            <div style={{
              fontSize: Math.max(7, 10 * scale), color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {description}
            </div>
          )}
          {disclaimer && (
            <div style={{
              fontSize: Math.max(6, 7 * scale), color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.2, marginTop: 2, fontStyle: 'italic',
            }}>
              {disclaimer}
            </div>
          )}
        </div>

        {selectionRing}
      </div>
    )
  }

  return null
}

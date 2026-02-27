'use client'
import React, { useCallback, useRef } from 'react'
import { PlacedBlock, DisplayMode, StampPosition, StampType } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { PriceDisplay } from './PriceDisplay'
import { PriceCalloutCircle } from './PriceCalloutCircle'
import { StampBadge, STAMP_CONFIG } from './StampBadge'
import { OverlayRenderer } from './OverlayRenderer'

interface Props {
  placedBlock: PlacedBlock
  scale: number
  isSelected?: boolean
  onSelect?: () => void
  mode?: 'edit' | 'preview' | 'readonly'
}

export function BlockRenderer({ placedBlock, scale, isSelected, onSelect, mode = 'edit' }: Props) {
  const blockData = placedBlock.blockData
  const blockRootRef = useRef<HTMLDivElement>(null)

  // ── Draggable stamps ────────────────────────────────────────────────
  const handleStampPointerDown = useCallback((stamp: StampType) => (e: React.PointerEvent) => {
    if (mode !== 'edit') return
    e.stopPropagation()
    e.preventDefault()

    const blockEl = blockRootRef.current
    if (!blockEl) return
    const rect = blockEl.getBoundingClientRect()

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(5, Math.min(95, ((ev.clientY - rect.top) / rect.height) * 100))
      const store = useAdStore.getState()
      const pb = store.ad?.sections.flatMap(s => s.pages).flatMap(p => p.placedBlocks).find(b => b.id === placedBlock.id)
      const existing = (pb?.overrides?.stampPositions as Record<string, unknown>) || {}
      store.updateBlockOverride(placedBlock.id, { stampPositions: { ...existing, [stamp]: { x, y } } })
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [mode, placedBlock.id])

  // ── Resizable stamps ────────────────────────────────────────────────
  const handleStampResizePointerDown = useCallback((stamp: StampType, startDesignSize: number) => (e: React.PointerEvent) => {
    if (mode !== 'edit') return
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY

    const onMove = (ev: PointerEvent) => {
      // Diagonal delta in screen px → convert to design units via scale
      const delta = ((ev.clientX - startX) + (ev.clientY - startY)) / 2 / scale
      const newSize = Math.round(Math.max(20, Math.min(140, startDesignSize + delta)))
      const store = useAdStore.getState()
      const pb = store.ad?.sections.flatMap(s => s.pages).flatMap(p => p.placedBlocks).find(b => b.id === placedBlock.id)
      const existing = (pb?.overrides?.stampSizes as Partial<Record<StampType, number>>) || {}
      store.updateBlockOverride(placedBlock.id, { stampSizes: { ...existing, [stamp]: newSize } })
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [mode, placedBlock.id, scale])

  // ── Draggable price circle ──────────────────────────────────────────
  // stopPropagation prevents dnd-kit from starting a block-move drag
  const handleCirclePointerDown = useCallback((e: React.PointerEvent) => {
    if (mode !== 'edit') return
    e.stopPropagation()
    e.preventDefault()

    const blockEl = blockRootRef.current
    if (!blockEl) return
    const rect = blockEl.getBoundingClientRect()

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(5, Math.min(95, ((ev.clientY - rect.top) / rect.height) * 100))
      useAdStore.getState().updateBlockOverride(placedBlock.id, { priceX: x, priceY: y })
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [mode, placedBlock.id])

  if (!blockData) return null

  const feed = blockData.feedJson
  const overrides = placedBlock.overrides || {}
  const isPromo = (feed as Record<string, unknown>).blockType === 'promotional'

  const displayMode: DisplayMode = (overrides.displayMode as DisplayMode) ||
    (isPromo ? 'sale_band' : 'product_image')
  const stamps: StampType[] = (overrides.stamps as StampType[]) || feed.stamps || []
  const bgColor = (overrides.backgroundColor as string) || '#FFFFFF'
  const headline = (overrides.headline as string) || feed.headline || feed.productName || ''
  const description = (overrides.description as string) || feed.description || ''
  const disclaimer = (overrides.disclaimer as string) || feed.disclaimer || ''
  const textColor = (overrides as Record<string, string>).textColor || '#FFFFFF'

  const lifestyleImg = feed.images?.lifestyle
  const productImg = feed.images?.product
  const activeImage =
    displayMode === 'lifestyle_image' || displayMode === 'text_overlay'
      ? lifestyleImg ?? productImg
      : (overrides.activeImage as string) === 'lifestyle'
      ? lifestyleImg
      : productImg

  const hasPrice = !!feed.price || !!feed.upc
  const imageOnly = displayMode === 'product_image' || displayMode === 'lifestyle_image'
  const showPrice = hasPrice && displayMode !== 'combo_no_price'
  const isSmall = placedBlock.height * scale < 120 * scale

  // ── Overlay components (stamp-like, compositable on any display mode) ─
  const priceCircleOverlay = !!(overrides.priceCircleOverlay as boolean)

  const circleOverlaySize = Math.min(
    placedBlock.width * scale * 0.55,
    placedBlock.height * scale * 0.55,
    140
  )
  const scaleMultiplier = (overrides.priceScale as number) ?? 1
  const pxPct = (overrides.priceX as number) ?? 50
  const pyPct = (overrides.priceY as number) ?? 50

  const circleRingColor = (overrides.priceCircleRingColor as string) || '#C8102E'
  const circleBgColor = (overrides.priceCircleBackground as string) || '#FFFAFA'

  const priceCircleOverlayEl = priceCircleOverlay && hasPrice ? (
    <div
      onPointerDown={handleCirclePointerDown}
      style={{
        position: 'absolute',
        left: `${pxPct}%`,
        top: `${pyPct}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 25,
        cursor: mode === 'edit' ? 'move' : 'default',
      }}
    >
      <PriceCalloutCircle
        upc={feed.upc}
        fallbackPrice={feed.price}
        size={Math.max(40, circleOverlaySize * scaleMultiplier)}
        ringColor={circleRingColor}
        bgColor={circleBgColor}
      />
    </div>
  ) : null

  const promoPrice = (overrides.priceText as string) || (feed as Record<string, unknown>).priceText as string | undefined

  // ── Shared elements ─────────────────────────────────────────────────
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    cursor: mode === 'edit' ? 'grab' : 'default',
    userSelect: 'none',
    boxShadow: isSelected
      ? '0 0 0 2px #1565C0, 0 4px 16px rgba(0,0,0,0.2)'
      : '0 2px 8px rgba(0,0,0,0.12)',
  }

  const selectionRing = isSelected ? (
    <div style={{ position: 'absolute', inset: 0, border: '2px solid #1565C0', borderRadius: 4, pointerEvents: 'none', zIndex: 100 }} />
  ) : null

  const stampSizeMap   = (overrides.stampSizes  as Partial<Record<StampType, number>>)  || {}
  const stampColorMap  = (overrides.stampColors as Partial<Record<StampType, string>>)  || {}
  const stampShapeMap  = (overrides.stampShapes as Partial<Record<StampType, 'circle' | 'square' | 'pill'>>) || {}
  const stampTextMap   = (overrides.stampTexts  as Partial<Record<StampType, string>>)  || {}

  const stampBadges = stamps.slice(0, 2).map((stamp, i) => {
    const defaultPositions: StampPosition[] = ['top-left', 'top-right']
    const pos = (overrides.stampPositions as Record<string, StampPosition | { x: number; y: number }>)?.[stamp] || defaultPositions[i]
    const designSize = stampSizeMap[stamp] ?? 48
    const stampSize = Math.max(20, designSize * scale)
    return (
      <StampBadge
        key={stamp}
        type={stamp}
        position={pos}
        pct={feed.price?.percentOff ?? undefined}
        size={stampSize}
        colorOverride={stampColorMap[stamp]}
        shapeOverride={stampShapeMap[stamp]}
        textOverride={stampTextMap[stamp]}
        onPointerDown={mode === 'edit' ? handleStampPointerDown(stamp) : undefined}
        onResizePointerDown={mode === 'edit' ? handleStampResizePointerDown(stamp, designSize) : undefined}
        showHandles={isSelected && mode === 'edit'}
      />
    )
  })

  // ── Overlay blocks (stamp_overlay, sale_band) — delegate to OverlayRenderer ──
  if (displayMode === 'stamp_overlay' || displayMode === 'sale_band') {
    return <OverlayRenderer placedBlock={placedBlock} scale={scale} isSelected={isSelected} onSelect={onSelect} mode={mode} />
  }

  // ── Price Circle mode ───────────────────────────────────────────────
  // The price circle is a DRAGGABLE overlay — use handleCirclePointerDown
  // to move it freely within the block, independent of block drag.
  if (displayMode === 'price_circle') {
    const priceScaleMultiplier = (overrides.priceScale as number) ?? 1
    const baseCircleSize = Math.min(
      placedBlock.width * scale * 0.68,
      placedBlock.height * scale * 0.65,
      180
    )
    const circleSize = Math.max(40, baseCircleSize * priceScaleMultiplier)
    const pxPct = (overrides.priceX as number) ?? 38
    const pyPct = (overrides.priceY as number) ?? 45

    return (
      <div ref={blockRootRef} onClick={onSelect} style={{ ...baseStyle, backgroundColor: bgColor }}>
        {/* Full-bleed lifestyle/product image */}
        {activeImage && (
          <img
            src={activeImage.url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        )}

        {/* DRAGGABLE price circle — onPointerDown stops block-level dnd-kit drag */}
        {hasPrice && (
          <div
            onPointerDown={handleCirclePointerDown}
            style={{
              position: 'absolute',
              left: `${pxPct}%`,
              top: `${pyPct}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              cursor: mode === 'edit' ? 'move' : 'default',
            }}
          >
            <PriceCalloutCircle
              upc={feed.upc}
              fallbackPrice={feed.price}
              size={circleSize}
              ringColor={circleRingColor}
              bgColor={circleBgColor}
            />
          </div>
        )}

        {/* Text — sits at bottom with gradient for legibility */}
        {(headline || description) && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: `${Math.max(8, 16 * scale)}px ${6 * scale}px ${6 * scale}px`,
              background: 'linear-gradient(to top, rgba(255,255,255,0.96) 70%, transparent)',
            }}
          >
            {headline && (
              <div style={{ fontSize: Math.max(8, 11 * scale), fontWeight: 700, color: '#111', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {headline}
              </div>
            )}
            {!isSmall && description && (
              <div style={{ fontSize: Math.max(6, 8 * scale), color: '#555', lineHeight: 1.3, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {description}
              </div>
            )}
          </div>
        )}

        {/* Edit hint when selected */}
        {isSelected && mode === 'edit' && (
          <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(21,101,192,0.85)', color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 10, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
            Drag circle to reposition
          </div>
        )}
        {stampBadges}
        {selectionRing}
      </div>
    )
  }

  // ── Text Overlay mode ───────────────────────────────────────────────
  // Full-bleed lifestyle image + text overlaid (image 12 style).
  if (displayMode === 'text_overlay') {
    const overlayPos = (overrides as Record<string, string>).textOverlayPosition || 'bottom'
    const verticalAlign = overlayPos === 'center' ? 'center' : overlayPos === 'top' ? 'flex-start' : 'flex-end'

    return (
      <div ref={blockRootRef} onClick={onSelect} style={{ ...baseStyle }}>
        {/* Full-bleed image */}
        {activeImage ? (
          <img
            src={activeImage.url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: bgColor }} />
        )}

        {/* Gradient scrim behind text */}
        {overlayPos !== 'center' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: overlayPos === 'bottom'
                ? 'linear-gradient(to top, rgba(0,0,0,0.65) 40%, transparent 80%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.65) 40%, transparent 80%)',
            }}
          />
        )}
        {overlayPos === 'center' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        )}

        {/* Text container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: verticalAlign,
            padding: `${8 * scale}px ${10 * scale}px`,
            gap: 4,
          }}
        >
          {headline && (
            <div
              style={{
                fontSize: Math.max(11, 18 * scale),
                fontWeight: 900,
                color: textColor,
                textAlign: 'center',
                lineHeight: 1.15,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {headline}
            </div>
          )}
          {description && (
            <div
              style={{
                fontSize: Math.max(8, 11 * scale),
                fontWeight: 600,
                color: textColor,
                textAlign: 'center',
                lineHeight: 1.3,
                opacity: 0.9,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {description}
            </div>
          )}
        </div>
        {priceCircleOverlayEl}
        {stampBadges}
        {selectionRing}
      </div>
    )
  }

  // ── Default: product_image / lifestyle_image / combo / text_only ────
  // Content layout — controls where the price+text block sits relative to image
  const contentLayout = (overrides.contentLayout as string) || 'image-top'
  const isHorizontal = contentLayout === 'image-left' || contentLayout === 'image-right'
  // image-top/image-left → image renders first in DOM (top or left)
  // image-bottom/image-right → content renders first in DOM (reversed)
  const isImageFirst = contentLayout === 'image-top' || contentLayout === 'image-left'
  const flexDir: React.CSSProperties['flexDirection'] = isHorizontal
    ? (isImageFirst ? 'row' : 'row-reverse')
    : (isImageFirst ? 'column' : 'column-reverse')

  // Image sizing
  // combo_no_price vertical: image fills all remaining space, content auto-sizes to text
  const imageFlex = imageOnly
    ? '1 1 100%'
    : isHorizontal
      ? '0 0 50%'
      : displayMode === 'combo_no_price'
        ? '1 1 auto'
        : displayMode === 'combo'
          ? '0 0 55%'
          : isSmall ? '0 0 60%' : '0 0 58%'

  // In horizontal layouts, show price first (most prominent), then headline
  const priceScaleH = Math.min(scale, isHorizontal ? 1.5 : 1.2)

  return (
    <div
      ref={blockRootRef}
      onClick={onSelect}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        cursor: mode === 'edit' ? 'grab' : 'default',
        userSelect: 'none',
        boxShadow: isSelected
          ? '0 0 0 2px #1565C0, 0 4px 16px rgba(0,0,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: flexDir,
      }}
    >
      {/* Image area */}
      {displayMode !== 'text_only' && (
        <div
          style={{
            flex: imageFlex,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {displayMode === 'lifestyle_image' && lifestyleImg ? (
            <img src={lifestyleImg.url} alt={lifestyleImg.altText || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
          ) : activeImage ? (
            <img
              src={activeImage.url}
              alt={activeImage.altText || ''}
              style={(overrides.activeImage as string) === 'lifestyle'
                ? { width: '100%', height: '100%', objectFit: 'cover' }
                : { width: '85%', height: '90%', objectFit: 'contain', margin: 'auto', display: 'block', padding: '4px' }
              }
              draggable={false}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', color: '#999', fontSize: 10 * scale }}>
              No Image
            </div>
          )}
        </div>
      )}

      {/* Content area (price + text) */}
      {!imageOnly && (
        displayMode === 'combo_no_price' ? (
          // ── combo_no_price: single concatenated text block, no flex auto-margin tricks ──
          // headline + description + disclaimer joined into one element so there is no gap
          <div style={{
            flex: isHorizontal ? 1 : '0 0 auto',
            padding: `${4 * scale}px ${6 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isHorizontal ? 'center' : 'flex-start',
            alignItems: isHorizontal ? 'center' : 'flex-start',
            overflow: 'hidden',
            minWidth: 0,
          }}>
            <div style={{
              fontSize: Math.max(8, 11 * scale),
              fontWeight: 600,
              lineHeight: 1.4,
              color: '#111',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 8,
              WebkitBoxOrient: 'vertical',
              textAlign: isHorizontal ? 'center' : 'left',
            }}>
              {[headline, description, disclaimer].filter(Boolean).join(' ')}
            </div>
          </div>
        ) : (
        <div style={{
          flex: 1,
          padding: `${4 * scale}px ${6 * scale}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
          justifyContent: displayMode === 'text_only' ? 'center' : isHorizontal ? 'center' : 'flex-start',
          alignItems: displayMode === 'text_only' ? 'center' : 'flex-start',
        }}>
          {/* Price shown first in horizontal layouts (Meijer ad style) */}
          {showPrice && isHorizontal && (
            <PriceDisplay upc={feed.upc} fallbackPrice={feed.price} scale={priceScaleH} />
          )}

          {(displayMode === 'text_only' || !isSmall) && headline && (
            <div style={{
              fontSize: displayMode === 'text_only'
                ? Math.max(9, Math.min(placedBlock.height * scale * 0.20, 14))
                : Math.max(8, 11 * scale),
              fontWeight: 700,
              lineHeight: 1.2,
              color: displayMode === 'text_only'
                ? ((overrides as Record<string, string>).textColor || '#111')
                : '#111',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: isHorizontal ? 3 : (displayMode === 'text_only' ? 4 : 2),
              WebkitBoxOrient: 'vertical',
              textAlign: displayMode === 'text_only' ? 'center' : 'left',
            }}>
              {headline}
            </div>
          )}

          {/* Price shown after headline in vertical layouts */}
          {showPrice && !isHorizontal && (
            <PriceDisplay upc={feed.upc} fallbackPrice={feed.price} scale={priceScaleH} />
          )}

          {(displayMode === 'text_only' || !isSmall) && description && (
            <div style={{
              fontSize: displayMode === 'text_only'
                ? Math.max(7, Math.min(placedBlock.height * scale * 0.12, 10))
                : Math.max(7, 9 * scale),
              color: displayMode === 'text_only'
                ? ((overrides as Record<string, string>).textColor || '#555')
                : '#555',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: displayMode === 'text_only' ? 4 : 2,
              WebkitBoxOrient: 'vertical',
              textAlign: displayMode === 'text_only' ? 'center' : 'left',
              opacity: displayMode === 'text_only' ? 0.85 : 1,
            }}>
              {description}
            </div>
          )}

          {disclaimer && (
            <div style={{ fontSize: Math.max(6, 8 * scale), color: '#888', lineHeight: 1.2, marginTop: 'auto', fontStyle: 'italic' }}>
              {disclaimer}
            </div>
          )}
        </div>
        )
      )}

      {/* Stamps */}
      {stampBadges}

      {/* Price circle overlay */}
      {priceCircleOverlayEl}

      {/* Selection ring */}
      {isSelected && (
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #1565C0', borderRadius: 4, pointerEvents: 'none', zIndex: 100 }} />
      )}
    </div>
  )
}

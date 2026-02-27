'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Ad, Page, PlacedBlock, BackgroundLayer, TemplateLayout, DisplayMode, StampType, StampPosition } from '@/types'
import { BackgroundLayer as BgLayer } from '@/components/canvas/BackgroundLayer'
import { BlockRenderer } from '@/components/canvas/BlockRenderer'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 1100

interface Props {
  ad: Ad
}

export function AdPrintPages({ ad }: Props) {
  const allPages = ad.sections.flatMap(s =>
    [...s.pages].sort((a, b) => a.position - b.position)
  )

  const [ready, setReady] = useState(false)
  const imageCountRef = useRef(0)
  const imageTotalRef = useRef(0)

  // Count total images across all pages so we know when everything has loaded
  useEffect(() => {
    let total = 0
    for (const page of allPages) {
      for (const pb of page.placedBlocks) {
        const feed = pb.blockData?.feedJson as Record<string, unknown> | undefined
        if (!feed) continue
        const images = feed.images as Record<string, { url?: string } | null> | undefined
        if (images?.product?.url) total++
        if (images?.lifestyle?.url) total++
      }
      // Count background layer images
      const layout = page.template?.layoutJson as TemplateLayout | undefined
      for (const layer of layout?.backgroundLayers ?? []) {
        if (layer.type === 'full-bleed-image' && layer.imageUrl) total++
      }
    }
    imageTotalRef.current = total

    // If no images at all, mark ready immediately
    if (total === 0) {
      setReady(true)
      return
    }

    // Safety net: mark ready after 8 seconds regardless of image load state
    const timeout = setTimeout(() => setReady(true), 8000)
    return () => clearTimeout(timeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function onImageLoad() {
    imageCountRef.current++
    if (imageCountRef.current >= imageTotalRef.current) {
      setReady(true)
    }
  }

  function onImageError() {
    // Broken image still counts as "done"
    imageCountRef.current++
    if (imageCountRef.current >= imageTotalRef.current) {
      setReady(true)
    }
  }

  return (
    <div
      data-pdf-ready={ready ? 'true' : 'false'}
      style={{ background: '#fff', padding: 0 }}
    >
      {allPages.map((page, pageIdx) => (
        <PrintPage
          key={page.id}
          page={page}
          pageIdx={pageIdx}
          isLast={pageIdx === allPages.length - 1}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
      ))}
    </div>
  )
}

// ── Single page renderer ────────────────────────────────────────────────────

interface PrintPageProps {
  page: Page
  pageIdx: number
  isLast: boolean
  onImageLoad: () => void
  onImageError: () => void
}

function PrintPage({ page, pageIdx: _pageIdx, isLast, onImageLoad, onImageError }: PrintPageProps) {
  const layout = page.template?.layoutJson as TemplateLayout | undefined
  const backgroundLayers = layout?.backgroundLayers ?? []
  const blocks = [...page.placedBlocks].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      style={{
        position: 'relative',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        pageBreakAfter: isLast ? 'auto' : 'always',
        breakAfter: isLast ? 'auto' : 'page',
      }}
    >
      {/* Background layers */}
      {backgroundLayers.map(layer => (
        <PrintBackgroundLayer
          key={layer.id}
          layer={layer}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
      ))}

      {/* Placed blocks */}
      {blocks.map(pb => (
        <PrintBlock
          key={pb.id}
          block={pb}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
      ))}
    </div>
  )
}

// ── Background layer wrapper (intercepts image load events) ─────────────────

interface PrintBgLayerProps {
  layer: BackgroundLayer
  onImageLoad: () => void
  onImageError: () => void
}

function PrintBackgroundLayer({ layer, onImageLoad, onImageError }: PrintBgLayerProps) {
  if (layer.type !== 'full-bleed-image' || !layer.imageUrl) {
    return <BgLayer layer={layer} scale={1} />
  }

  // For image layers, render manually so we can intercept load/error
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        zIndex: layer.zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <img
        src={layer.imageUrl}
        alt=""
        onLoad={onImageLoad}
        onError={onImageError}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {layer.overlay && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: layer.overlay }} />
      )}
    </div>
  )
}

// ── Individual block wrapper ─────────────────────────────────────────────────

interface PrintBlockProps {
  block: PlacedBlock
  onImageLoad: () => void
  onImageError: () => void
}

function PrintBlock({ block, onImageLoad, onImageError }: PrintBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Attach onLoad/onError listeners to all <img> elements rendered by BlockRenderer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const imgs = el.querySelectorAll('img')
    if (imgs.length === 0) return

    const handlers: Array<{ img: HTMLImageElement; load: () => void; error: () => void }> = []

    imgs.forEach(img => {
      if (img.complete) {
        onImageLoad()
      } else {
        const load = () => onImageLoad()
        const error = () => onImageError()
        img.addEventListener('load', load)
        img.addEventListener('error', error)
        handlers.push({ img, load, error })
      }
    })

    return () => {
      handlers.forEach(({ img, load, error }) => {
        img.removeEventListener('load', load)
        img.removeEventListener('error', error)
      })
    }
  }, [onImageLoad, onImageError])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
      }}
    >
      <BlockRenderer
        placedBlock={block}
        scale={1}
        isSelected={false}
        mode="readonly"
      />
    </div>
  )
}

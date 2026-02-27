'use client'
import React, { useRef, useCallback } from 'react'
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { Page, PlacedBlock as PB, TemplateZone, BlockData, TemplateLayout } from '@/types'
import { BackgroundLayer } from './BackgroundLayer'
import { BlockRenderer } from './BlockRenderer'
import { ZoneOverlay } from './ZoneOverlay'
import { useUIStore } from '@/stores/uiStore'
import { useAdStore } from '@/stores/adStore'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 1100

interface DraggableBlockProps {
  placedBlock: PB
  scale: number
  isSelected: boolean
  onSelect: () => void
  mode: 'edit' | 'preview' | 'readonly'
}

function DraggableBlock({ placedBlock, scale, isSelected, onSelect, mode }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${placedBlock.id}`,
    data: { type: 'placed', placedBlock },
    disabled: mode !== 'edit',
  })

  const resizeStart = useRef<{ x: number; y: number; w: number; h: number; px: number; py: number } | null>(null)

  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    if (mode !== 'edit') return
    e.stopPropagation()
    e.preventDefault()

    const start = {
      x: placedBlock.x,
      y: placedBlock.y,
      w: placedBlock.width,
      h: placedBlock.height,
      px: e.clientX,
      py: e.clientY,
    }
    resizeStart.current = start

    const onMove = (ev: PointerEvent) => {
      if (!resizeStart.current) return
      const dx = (ev.clientX - resizeStart.current.px) / scale
      const dy = (ev.clientY - resizeStart.current.py) / scale
      const newW = Math.max(80, resizeStart.current.w + dx)
      const newH = Math.max(80, resizeStart.current.h + dy)
      useAdStore.getState().resizeBlock(placedBlock.id, resizeStart.current.x, resizeStart.current.y, newW, newH)
    }

    const onUp = () => {
      resizeStart.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [mode, placedBlock.x, placedBlock.y, placedBlock.width, placedBlock.height, scale, placedBlock.id])

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        left: placedBlock.x * scale,
        top: placedBlock.y * scale,
        width: placedBlock.width * scale,
        height: placedBlock.height * scale,
        zIndex: placedBlock.zIndex,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
      }}
    >
      <BlockRenderer
        placedBlock={placedBlock}
        scale={scale}
        isSelected={isSelected}
        onSelect={onSelect}
        mode={mode}
      />
      {isSelected && mode === 'edit' && (
        <div
          onPointerDown={handleResizeDown}
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            width: 20,
            height: 20,
            backgroundColor: '#1565C0',
            borderRadius: 3,
            cursor: 'se-resize',
            zIndex: 200,
            border: '2px solid #fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      )}
    </div>
  )
}

interface CanvasDropZoneProps {
  pageId: string
  children: React.ReactNode
  width: number
  height: number
}

function CanvasDropZone({ pageId, children, width, height }: CanvasDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `canvas:${pageId}`,
    data: { type: 'canvas', pageId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        width,
        height,
        outline: isOver ? '2px solid #1565C0' : 'none',
      }}
    >
      {children}
    </div>
  )
}

function ZoneDropTarget({
  zone,
  scale,
  pageId,
  isDragging,
}: {
  zone: TemplateZone
  scale: number
  pageId: string
  isDragging: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: `zone:${zone.id}`,
    data: { type: 'zone', zoneId: zone.id, pageId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: zone.x * scale,
        top: zone.y * scale,
        width: zone.width * scale,
        height: zone.height * scale,
        zIndex: 40,
        // Only intercept pointer events during an active drag; otherwise blocks are unreachable
        pointerEvents: isDragging ? 'all' : 'none',
      }}
    />
  )
}

interface Props {
  page: Page
  allBlockData: BlockData[]
  mode?: 'edit' | 'preview' | 'readonly'
  scale?: number
}

export function PageCanvas({ page, allBlockData, mode = 'edit', scale: scaleProp }: Props) {
  const { selectedBlockId, selectBlock, zoom, isDragging } = useUIStore()

  const template = page.template
  const layout = template?.layoutJson as TemplateLayout | undefined
  const zones: TemplateZone[] = layout?.zones || []

  const canvasNativeW = layout?.canvas?.width || CANVAS_WIDTH
  const canvasNativeH = layout?.canvas?.height || CANVAS_HEIGHT
  const effectiveScale = scaleProp ?? zoom
  const canvasW = canvasNativeW * effectiveScale
  const canvasH = canvasNativeH * effectiveScale

  if (!template || !layout) {
    return (
      <div
        style={{
          width: canvasW || CANVAS_WIDTH,
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #ccc',
          borderRadius: 8,
          color: '#999',
          fontSize: 14,
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span>No template selected</span>
        <span style={{ fontSize: 12 }}>Click &quot;Change Template&quot; to add a layout</span>
      </div>
    )
  }

  return (
    <div style={{ width: canvasW, height: canvasH, position: 'relative' }}>
      <CanvasDropZone pageId={page.id} width={canvasW} height={canvasH}>
        <div data-canvas={page.id} style={{ position: 'absolute', inset: 0 }}>
          {/* Background layers */}
          {layout.backgroundLayers?.map(layer => (
            <BackgroundLayer key={layer.id} layer={layer} scale={effectiveScale} />
          ))}

          {/* Zone overlays (shown during drag) */}
          <ZoneOverlay
            zones={zones}
            scale={effectiveScale}
            isDragging={isDragging}
            activeZoneId={null}
            occupiedZoneIds={new Set(
              page.placedBlocks.map(pb => pb.zoneId).filter(Boolean) as string[]
            )}
          />

          {/* Zone drop targets — pointer events only during drag */}
          {zones.map(zone => (
            <ZoneDropTarget key={zone.id} zone={zone} scale={effectiveScale} pageId={page.id} isDragging={isDragging} />
          ))}

          {/* Placed blocks */}
          {page.placedBlocks.map(pb => (
            <DraggableBlock
              key={pb.id}
              placedBlock={{
                ...pb,
                blockData:
                  allBlockData.find(bd => bd.id === pb.blockDataId) || pb.blockData,
              }}
              scale={effectiveScale}
              isSelected={selectedBlockId === pb.id}
              onSelect={() => selectBlock(pb.id)}
              mode={mode}
            />
          ))}
        </div>
      </CanvasDropZone>
    </div>
  )
}

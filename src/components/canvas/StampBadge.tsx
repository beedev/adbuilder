'use client'
import React from 'react'
import { StampType, StampPosition } from '@/types'

export const STAMP_CONFIG: Record<StampType, { bg: string; text: string; shape: string }> = {
  SALE: { bg: '#C8102E', text: 'SALE', shape: 'burst' },
  BOGO: { bg: '#1B5E20', text: 'BUY 1\nGET 1 FREE', shape: 'banner' },
  PCT_OFF: { bg: '#C8102E', text: '% OFF', shape: 'circle' },
  HOT_DEAL: { bg: '#E65100', text: 'HOT\nDEAL', shape: 'flame' },
  NEW: { bg: '#1565C0', text: 'NEW!', shape: 'tag' },
  ORGANIC: { bg: '#2E7D32', text: 'ORGANIC', shape: 'leaf' },
  LOCAL: { bg: '#4E342E', text: 'LOCALLY\nGROWN', shape: 'ribbon' },
  SEASONAL: { bg: '#F57C00', text: 'SEASONAL', shape: 'arc' },
  MANAGERS_SPECIAL: { bg: '#6A1B9A', text: "MANAGER'S\nSPECIAL", shape: 'star' },
  CLEARANCE: { bg: '#F9A825', text: 'CLEARANCE', shape: 'tag' },
  FRESH: { bg: '#2E7D32', text: 'FRESH', shape: 'circle' },
  PICKUP: { bg: '#1565C0', text: 'PICKUP\nREADY', shape: 'circle' },
  DELIVERY: { bg: '#0D47A1', text: 'DELIVERY', shape: 'circle' },
  FEATURED: { bg: '#880E4F', text: 'FEATURED', shape: 'burst' },
  EXCLUSIVE: { bg: '#4A148C', text: 'EXCLUSIVE', shape: 'burst' },
  LIMITED: { bg: '#BF360C', text: 'LIMITED\nTIME', shape: 'burst' },
  DIGITAL_COUPON: { bg: '#006064', text: 'DIGITAL\nCOUPON', shape: 'tag' },
  BUY_MORE: { bg: '#1B5E20', text: 'BUY MORE\nSAVE MORE', shape: 'banner' },
}

// Corner strings map to default percentage coordinates
export const CORNER_TO_PCT: Record<StampPosition, { x: number; y: number }> = {
  'top-left':     { x: 10, y: 10 },
  'top-right':    { x: 90, y: 10 },
  'bottom-left':  { x: 10, y: 90 },
  'bottom-right': { x: 90, y: 90 },
}

export interface StampCoords { x: number; y: number }

interface Props {
  type: StampType
  position: StampPosition | StampCoords
  pct?: number
  size?: number
  onPointerDown?: (e: React.PointerEvent) => void
  onResizePointerDown?: (e: React.PointerEvent) => void
  showHandles?: boolean
}

export function StampBadge({
  type,
  position,
  pct,
  size = 52,
  onPointerDown,
  onResizePointerDown,
  showHandles,
}: Props) {
  const config = STAMP_CONFIG[type]
  if (!config) return null

  const text = type === 'PCT_OFF' && pct ? `${pct}%\nOFF` : config.text
  const lines = text.split('\n')

  const coords: StampCoords =
    typeof position === 'string'
      ? CORNER_TO_PCT[position] ?? { x: 10, y: 10 }
      : position

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: `${coords.x}%`,
        top: `${coords.y}%`,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: config.shape === 'circle' || config.shape === 'burst' ? '50%' : 4,
        backgroundColor: config.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        zIndex: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.6)',
        cursor: onPointerDown ? 'move' : 'default',
      }}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            color: '#fff',
            fontSize: size > 48 ? 9 : 7,
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.1,
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          {line}
        </span>
      ))}

      {/* Resize corner handle — only visible in edit mode when block is selected */}
      {showHandles && onResizePointerDown && (
        <div
          onPointerDown={onResizePointerDown}
          title="Drag to resize stamp"
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            width: 11,
            height: 11,
            backgroundColor: '#1565C0',
            borderRadius: 2,
            cursor: 'nwse-resize',
            border: '1.5px solid #fff',
            zIndex: 30,
          }}
        />
      )}
    </div>
  )
}

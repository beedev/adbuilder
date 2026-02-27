'use client'
import React from 'react'
import { TemplateZone } from '@/types'

interface Props {
  zones: TemplateZone[]
  scale: number
  isDragging: boolean
  activeZoneId?: string | null
  occupiedZoneIds?: Set<string>
}

export function ZoneOverlay({ zones, scale, isDragging, occupiedZoneIds = new Set() }: Props) {
  // Always show empty zone outlines (subtle), more prominent during drag
  return (
    <>
      {zones.map(zone => {
        const isOccupied = occupiedZoneIds.has(zone.id)
        if (isOccupied) return null // occupied zones are shown by the block itself
        return (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: zone.x * scale,
              top: zone.y * scale,
              width: zone.width * scale,
              height: zone.height * scale,
              zIndex: 0,
              border: `2px dashed ${isDragging ? '#1565C0' : '#CBD5E0'}`,
              borderRadius: 6,
              backgroundColor: isDragging ? 'rgba(21, 101, 192, 0.05)' : 'transparent',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            {isDragging && (
              <span style={{
                fontSize: 11 * scale,
                color: '#1565C0',
                opacity: 0.7,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}>
                Drop here
              </span>
            )}
          </div>
        )
      })}
    </>
  )
}

'use client'
import React from 'react'
import { BackgroundLayer as BL } from '@/types'

interface Props {
  layer: BL
  scale: number
}

export function BackgroundLayer({ layer, scale }: Props) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: layer.x * scale,
    top: layer.y * scale,
    width: layer.width * scale,
    height: layer.height * scale,
    zIndex: layer.zIndex,
    overflow: 'hidden',
    pointerEvents: 'none',
  }

  if (layer.type === 'solid') {
    return <div style={{ ...style, backgroundColor: layer.color || '#fff' }} />
  }

  if (layer.type === 'diagonal-split') {
    const angle = layer.angle || -3
    return (
      <div style={style}>
        <div style={{ width: '100%', height: '100%', backgroundColor: layer.colorTop || '#C8102E' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-10%',
            width: '120%',
            height: '55%',
            backgroundColor: layer.colorBottom || '#fff',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'bottom left',
          }}
        />
      </div>
    )
  }

  if (layer.type === 'wave') {
    return (
      <div style={style}>
        <div style={{ width: '100%', height: '50%', backgroundColor: layer.colorTop || '#E8F5E9' }} />
        <svg
          viewBox="0 0 800 80"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '40%', display: 'block' }}
        >
          <path
            d="M0,0 C200,80 600,80 800,0 L800,80 L0,80 Z"
            fill={layer.colorBottom || '#fff'}
          />
        </svg>
        <div style={{ width: '100%', height: '10%', backgroundColor: layer.colorBottom || '#fff' }} />
      </div>
    )
  }

  if (layer.type === 'full-bleed-image' && layer.imageUrl) {
    return (
      <div style={style}>
        <img
          src={layer.imageUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {layer.overlay && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: layer.overlay }} />
        )}
      </div>
    )
  }

  // gradient fallback
  return (
    <div
      style={{
        ...style,
        background: `linear-gradient(${layer.colorTop || '#C8102E'}, ${layer.colorBottom || '#fff'})`,
      }}
    />
  )
}

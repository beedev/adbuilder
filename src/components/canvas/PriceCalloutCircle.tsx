'use client'
import React from 'react'
import { usePriceStore } from '@/stores/priceStore'
import { PriceData } from '@/types'

function formatCirclePrice(price: PriceData): {
  label: string
  main: string
  sup?: string   // superscript (cents)
  sub?: string   // unit line below
} {
  switch (price.priceType) {
    case 'x_for_y':
      return {
        label: 'sale',
        main: `${price.unitCount}/$${price.adPrice != null ? (Number.isInteger(price.adPrice) ? price.adPrice : price.adPrice.toFixed(0)) : ''}`,
      }
    case 'per_lb':
      if (price.adPrice != null) {
        const [dollars, cents] = price.adPrice.toFixed(2).split('.')
        return { label: 'sale', main: `$${dollars}`, sup: cents, sub: '/LB' }
      }
      return { label: 'sale', main: price.priceDisplay }
    case 'pct_off':
      return { label: 'sale', main: `${price.percentOff}%`, sub: 'OFF' }
    case 'bogo':
      if (price.adPrice != null) {
        const [dollars, cents] = price.adPrice.toFixed(2).split('.')
        return { label: 'BOGO', main: `$${dollars}`, sup: cents !== '00' ? cents : undefined }
      }
      return { label: 'BOGO', main: price.priceDisplay }
    case 'each':
    default:
      if (price.adPrice != null) {
        const [dollars, cents] = price.adPrice.toFixed(2).split('.')
        return {
          label: 'sale',
          main: `$${dollars}`,
          sup: cents !== '00' ? cents : undefined,
        }
      }
      return { label: 'sale', main: price.priceDisplay }
  }
}

interface Props {
  upc: string
  fallbackPrice?: PriceData | null
  size: number         // outer diameter in pixels (already scaled)
  ringColor?: string
  bgColor?: string
  labelText?: string   // override the computed italic label (e.g. "sale")
}

export function PriceCalloutCircle({
  upc,
  fallbackPrice,
  size,
  ringColor = '#C8102E',
  bgColor = '#FFFAFA',
  labelText,
}: Props) {
  const price = usePriceStore(s => s.getPrice(upc)) ?? fallbackPrice
  if (!price) return null

  const { label: computedLabel, main, sup, sub } = formatCirclePrice(price)
  const label = labelText ?? computedLabel
  const innerSize = size - 10   // gap for dashed ring

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* Outer dashed ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(2, size * 0.025)}px dashed ${ringColor}`,
        }}
      />

      {/* Inner filled circle */}
      <div
        style={{
          position: 'absolute',
          inset: 5,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: `${Math.max(1.5, size * 0.018)}px solid ${ringColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* "sale" label */}
        <span
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: Math.max(8, innerSize * 0.16),
            color: ringColor,
            lineHeight: 1,
            marginBottom: innerSize * 0.03,
          }}
        >
          {label}
        </span>

        {/* Main price row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: Math.max(14, innerSize * 0.38),
              color: '#111',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {main}
          </span>
          {sup && (
            <span
              style={{
                fontWeight: 900,
                fontSize: Math.max(8, innerSize * 0.18),
                color: '#111',
                lineHeight: 1,
                marginTop: innerSize * 0.04,
              }}
            >
              {sup}
            </span>
          )}
        </div>

        {/* Sub line (unit / OFF / FREE) */}
        {sub && (
          <span
            style={{
              fontWeight: 700,
              fontSize: Math.max(7, innerSize * 0.14),
              color: '#333',
              lineHeight: 1.1,
              marginTop: innerSize * 0.02,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

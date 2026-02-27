'use client'
import React from 'react'
import { usePriceStore } from '@/stores/priceStore'
import { formatPriceParts } from '@/lib/priceFormatter'
import { PriceData } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  upc: string
  fallbackPrice?: PriceData
  scale?: number
  textColor?: string
}

export function PriceDisplay({ upc, fallbackPrice, scale = 1, textColor = '#C8102E' }: Props) {
  const price = usePriceStore(s => s.getPrice(upc)) ?? fallbackPrice
  const isUpdated = usePriceStore(s => s.recentlyUpdated.has(upc))

  if (!price) return null

  const parts = formatPriceParts(price)
  const fs = scale

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={price.priceDisplay}
        initial={{ scale: isUpdated ? 1.15 : 1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          lineHeight: 1,
          position: 'relative',
        }}
      >
        {isUpdated && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 4,
              backgroundColor: '#FFF9C4',
              zIndex: -1,
            }}
          />
        )}

        {parts.isBig ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <span
              style={{
                fontSize: 28 * fs,
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
              }}
            >
              {parts.main}
            </span>
            {parts.cents && (
              <span
                style={{
                  fontSize: 14 * fs,
                  fontWeight: 900,
                  color: textColor,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {parts.cents}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              fontSize: 16 * fs,
              fontWeight: 800,
              color: textColor,
            }}
          >
            {parts.main}
          </span>
        )}

        {parts.unit && (
          <span
            style={{
              fontSize: 11 * fs,
              fontWeight: 700,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {parts.unit}
          </span>
        )}

        {price.savingsText && (
          <span
            style={{
              fontSize: 9 * fs,
              color: '#555',
              marginTop: 2,
            }}
          >
            {price.savingsText}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

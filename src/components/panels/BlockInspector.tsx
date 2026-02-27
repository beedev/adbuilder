'use client'
import React, { useState } from 'react'
import { PlacedBlock, DisplayMode, StampType, TemplateLayout } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { Trash2, Maximize2 } from 'lucide-react'

const DISPLAY_MODES: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'product_image', label: 'Product Image', desc: 'Image only' },
  { value: 'lifestyle_image', label: 'Lifestyle Image', desc: 'Lifestyle only' },
  { value: 'combo', label: 'Product + Text', desc: 'Image + price + text' },
  { value: 'combo_no_price', label: 'Product + Text (no price)', desc: 'Image + text, no price' },
  { value: 'text_only', label: 'Text Only', desc: 'No image' },
  { value: 'price_circle', label: 'Price Circle', desc: 'Large sale circle badge' },
  { value: 'sale_band', label: 'Sale Band', desc: 'Red banner with price' },
]

const ALL_STAMPS: StampType[] = [
  'SALE', 'BOGO', 'PCT_OFF', 'HOT_DEAL', 'NEW',
  'ORGANIC', 'LOCAL', 'SEASONAL', 'MANAGERS_SPECIAL', 'CLEARANCE',
  'FRESH', 'PICKUP', 'DELIVERY', 'FEATURED',
  'EXCLUSIVE', 'LIMITED', 'DIGITAL_COUPON', 'BUY_MORE',
]

const BG_COLORS = [
  // Whites / Neutrals
  '#FFFFFF', '#FAFAFA', '#F5F5F5', '#EEEEEE',
  // Warm yellows
  '#FFF9C4', '#FFF176', '#FFEE58', '#FDD835',
  // Reds / Pinks
  '#FCE4EC', '#F8BBD0', '#FFCDD2', '#EF9A9A',
  // Blues
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#42A5F5',
  // Greens
  '#E8F5E9', '#C8E6C9', '#A5D6A7', '#66BB6A',
  // Oranges
  '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFA726',
  // Purples
  '#F3E5F5', '#E1BEE7', '#CE93D8', '#AB47BC',
  // Brand
  '#C8102E', '#1565C0', '#2E7D32', '#E65100',
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'block',
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  )
}

interface Props {
  placedBlock: PlacedBlock
}

export function BlockInspector({ placedBlock }: Props) {
  const { updateBlockOverride, removeBlock, resizeBlock, ad } = useAdStore()
  const { selectBlock } = useUIStore()
  const [customHex, setCustomHex] = useState('')

  // Resolve zone for Fit-to-Zone
  const page = ad?.sections.flatMap(s => s.pages).find(p => p.id === placedBlock.pageId)
  const pageZones = (page?.template?.layoutJson as TemplateLayout | undefined)?.zones || []
  const zone = pageZones.find(z => z.id === placedBlock.zoneId)

  const feed = placedBlock.blockData?.feedJson
  const overrides = placedBlock.overrides || {}

  const currentMode: DisplayMode = (overrides.displayMode as DisplayMode) || 'product_image'
  const currentStamps: StampType[] = (overrides.stamps as StampType[]) || feed?.stamps || []
  const currentBg: string = (overrides.backgroundColor as string) || '#FFFFFF'

  const toggleStamp = (stamp: StampType) => {
    const next = currentStamps.includes(stamp)
      ? currentStamps.filter(s => s !== stamp)
      : currentStamps.length < 2
      ? [...currentStamps, stamp]
      : currentStamps
    updateBlockOverride(placedBlock.id, { stamps: next })
  }

  const handleRemove = () => {
    removeBlock(placedBlock.id)
    selectBlock(null)
  }

  if (!feed) return null

  return (

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Product info */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>
          {feed.productName}
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>UPC: {feed.upc}</div>
        <div style={{ fontSize: 11, color: '#888' }}>Category: {feed.category}</div>
      </div>

      {/* Display mode */}
      <div>
        <SectionLabel>Display Mode</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {DISPLAY_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => updateBlockOverride(placedBlock.id, { displayMode: m.value })}
              style={{
                padding: '5px 8px',
                border: '1px solid',
                borderColor: currentMode === m.value ? '#1565C0' : '#ddd',
                borderRadius: 4,
                backgroundColor: currentMode === m.value ? '#e3f2fd' : '#fff',
                color: currentMode === m.value ? '#1565C0' : '#555',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: currentMode === m.value ? 600 : 400,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: 9, color: currentMode === m.value ? '#1565C0' : '#aaa', fontWeight: 400 }}>
                {m.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Layout (image vs price+text position) ── */}
      {(currentMode === 'combo' || currentMode === 'combo_no_price' || currentMode === 'product_image' || currentMode === 'lifestyle_image' || currentMode === 'text_only') && (
        <div>
          <SectionLabel>Content Layout</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {([
              { value: 'image-top',    label: 'Image top',    icon: '⬆ img  ⬇ price' },
              { value: 'image-bottom', label: 'Image bottom', icon: '⬆ price ⬇ img' },
              { value: 'image-left',   label: 'Image left',   icon: '← img  price →' },
              { value: 'image-right',  label: 'Image right',  icon: '← price  img →' },
            ] as const).map(opt => {
              const current = (overrides.contentLayout as string) || 'image-top'
              const active = current === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateBlockOverride(placedBlock.id, { contentLayout: opt.value })}
                  style={{
                    padding: '6px 4px',
                    border: '1px solid',
                    borderColor: active ? '#1565C0' : '#ddd',
                    borderRadius: 5,
                    backgroundColor: active ? '#e3f2fd' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>{opt.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#1565C0' : '#555' }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Price Circle overlay ── */}
      <div>
        <SectionLabel>Price Circle</SectionLabel>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: overrides.priceCircleOverlay ? '#e3f2fd' : '#fafafa', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#555' }}>
            Shows this block&apos;s price as a badge
          </div>
          <button
            onClick={() => updateBlockOverride(placedBlock.id, { priceCircleOverlay: !overrides.priceCircleOverlay })}
            style={{
              width: 40, height: 22, borderRadius: 11,
              backgroundColor: overrides.priceCircleOverlay ? '#1565C0' : '#ccc',
              border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
              left: overrides.priceCircleOverlay ? 20 : 2,
            }} />
          </button>
        </div>

        {/* Variants + controls — shown whether overlay or price_circle mode */}
        {(overrides.priceCircleOverlay || currentMode === 'price_circle') && (() => {
          const ringColor = (overrides.priceCircleRingColor as string) || '#C8102E'
          const bgColor = (overrides.priceCircleBackground as string) || '#FFFAFA'

          const variants: { ring: string; bg: string; label: string }[] = [
            { ring: '#C8102E', bg: '#FFFAFA', label: 'Meijer Red' },
            { ring: '#1565C0', bg: '#F0F7FF', label: 'Blue' },
            { ring: '#2E7D32', bg: '#F1F8E9', label: 'Green' },
            { ring: '#F9A825', bg: '#FFFDE7', label: 'Gold' },
            { ring: '#E65100', bg: '#FFF3E0', label: 'Orange' },
            { ring: '#6A1B9A', bg: '#F3E5F5', label: 'Purple' },
            { ring: '#212121', bg: '#FAFAFA', label: 'Black' },
            { ring: '#FFFFFF', bg: 'rgba(255,255,255,0.12)', label: 'White' },
          ]

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Visual variant swatches */}
              <div>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 5 }}>Style variant</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {variants.map(v => {
                    const isActive = ringColor === v.ring && bgColor === v.bg
                    return (
                      <button
                        key={v.ring}
                        title={v.label}
                        onClick={() => updateBlockOverride(placedBlock.id, {
                          priceCircleRingColor: v.ring,
                          priceCircleBackground: v.bg,
                        })}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', padding: 0,
                          border: isActive ? '2px solid #1565C0' : '2px solid transparent',
                          boxShadow: isActive ? '0 0 0 1px #1565C0' : '0 1px 3px rgba(0,0,0,0.2)',
                          background: v.ring === '#FFFFFF'
                            ? 'linear-gradient(135deg, #fff 50%, #ddd 50%)'
                            : v.ring,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Custom colors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Ring color</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={ringColor}
                      onChange={e => updateBlockOverride(placedBlock.id, { priceCircleRingColor: e.target.value })}
                      style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <input
                      type="text"
                      value={ringColor}
                      maxLength={7}
                      onChange={e => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
                          updateBlockOverride(placedBlock.id, { priceCircleRingColor: e.target.value })
                      }}
                      style={{ flex: 1, padding: '3px 5px', border: '1px solid #ddd', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Fill color</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={bgColor.startsWith('rgba') ? '#ffffff' : bgColor}
                      onChange={e => updateBlockOverride(placedBlock.id, { priceCircleBackground: e.target.value })}
                      style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <input
                      type="text"
                      value={bgColor}
                      maxLength={7}
                      onChange={e => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
                          updateBlockOverride(placedBlock.id, { priceCircleBackground: e.target.value })
                      }}
                      style={{ flex: 1, padding: '3px 5px', border: '1px solid #ddd', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              {/* Position + scale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {([
                  { key: 'priceX', label: 'X %', default: 50 },
                  { key: 'priceY', label: 'Y %', default: 50 },
                  { key: 'priceScale', label: 'Scale', default: 1 },
                ] as const).map(field => (
                  <div key={field.key}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{field.label}</div>
                    <input
                      type="number"
                      step={field.key === 'priceScale' ? 0.1 : 5}
                      min={field.key === 'priceScale' ? 0.3 : 0}
                      max={field.key === 'priceScale' ? 3 : 100}
                      value={(overrides as Record<string, number>)[field.key] ?? field.default}
                      onChange={e => updateBlockOverride(placedBlock.id, { [field.key]: parseFloat(e.target.value) } as Record<string, number>)}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>

              {overrides.priceCircleOverlay && (
                <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>
                  Drag the circle on the canvas to reposition it
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Background color */}
      <div>
        <SectionLabel>Background</SectionLabel>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {BG_COLORS.map(color => (
            <button
              key={color}
              onClick={() => updateBlockOverride(placedBlock.id, { backgroundColor: color })}
              title={color}
              style={{
                width: 22,
                height: 22,
                borderRadius: 3,
                border: currentBg === color ? '2px solid #1565C0' : '1px solid #ccc',
                backgroundColor: color,
                cursor: 'pointer',
                padding: 0,
                boxShadow: currentBg === color ? '0 0 0 1px #1565C0' : 'none',
              }}
            />
          ))}
        </div>
        {/* Custom hex input */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 3,
              border: '1px solid #ccc',
              backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : currentBg,
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            placeholder="#RRGGBB"
            maxLength={7}
            value={customHex}
            onChange={e => {
              const v = e.target.value
              setCustomHex(v)
              if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                updateBlockOverride(placedBlock.id, { backgroundColor: v })
              }
            }}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          />
          <input
            type="color"
            value={currentBg}
            onChange={e => {
              setCustomHex(e.target.value)
              updateBlockOverride(placedBlock.id, { backgroundColor: e.target.value })
            }}
            style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Stamps */}
      <div>
        <SectionLabel>Stamps (max 2)</SectionLabel>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {ALL_STAMPS.map(stamp => {
            const active = currentStamps.includes(stamp)
            const disabled = !active && currentStamps.length >= 2
            return (
              <button
                key={stamp}
                onClick={() => !disabled && toggleStamp(stamp)}
                style={{
                  fontSize: 8,
                  padding: '3px 5px',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: active ? '#C8102E' : '#ddd',
                  backgroundColor: active ? '#C8102E' : disabled ? '#f5f5f5' : '#fff',
                  color: active ? '#fff' : disabled ? '#bbb' : '#555',
                  cursor: disabled ? 'default' : 'pointer',
                  fontWeight: active ? 700 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                {stamp.replace(/_/g, ' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Headline override */}
      <div>
        <SectionLabel>Headline</SectionLabel>
        <input
          value={(overrides.headline as string) || feed.headline || ''}
          onChange={e => updateBlockOverride(placedBlock.id, { headline: e.target.value })}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 12,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Description override */}
      <div>
        <SectionLabel>Description</SectionLabel>
        <textarea
          value={(overrides.description as string) || feed.description || ''}
          onChange={e => updateBlockOverride(placedBlock.id, { description: e.target.value })}
          rows={2}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 12,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {zone && (
          <button
            onClick={() => resizeBlock(placedBlock.id, zone.x, zone.y, zone.width, zone.height)}
            style={{
              width: '100%',
              padding: '7px',
              backgroundColor: '#fff',
              border: '1px solid #1565C0',
              borderRadius: 4,
              color: '#1565C0',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            <Maximize2 size={13} />
            Fit to Zone
          </button>
        )}
        <button
          onClick={handleRemove}
          style={{
            width: '100%',
            padding: '7px',
            backgroundColor: '#fff',
            border: '1px solid #ffcdd2',
            borderRadius: 4,
            color: '#c62828',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          <Trash2 size={14} />
          Remove from page
        </button>
      </div>
    </div>
  )
}

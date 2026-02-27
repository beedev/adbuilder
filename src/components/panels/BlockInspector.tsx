'use client'
import React, { useState } from 'react'
import { PlacedBlock, DisplayMode, TemplateLayout } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { Trash2, Maximize2, ChevronDown } from 'lucide-react'
import { OverlayInspector } from './OverlayInspector'

const DISPLAY_MODES: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'product_image',   label: 'Product Image',           desc: 'Image only' },
  { value: 'lifestyle_image', label: 'Lifestyle Image',         desc: 'Lifestyle only' },
  { value: 'combo',           label: 'Product + Text',          desc: 'Image + price + text' },
  { value: 'combo_no_price',  label: 'Product + Text (no price)', desc: 'Image + text, no price' },
  { value: 'text_only',       label: 'Text Only',               desc: 'No image' },
  { value: 'price_circle',    label: 'Price Circle',            desc: 'Large sale circle badge' },
  { value: 'sale_band',       label: 'Sale Band',               desc: 'Red banner with price' },
]

const BG_COLORS = [
  '#FFFFFF', '#FAFAFA', '#F5F5F5', '#EEEEEE',
  '#FFF9C4', '#FFF176', '#FFEE58', '#FDD835',
  '#FCE4EC', '#F8BBD0', '#FFCDD2', '#EF9A9A',
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#42A5F5',
  '#E8F5E9', '#C8E6C9', '#A5D6A7', '#66BB6A',
  '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFA726',
  '#F3E5F5', '#E1BEE7', '#CE93D8', '#AB47BC',
  '#C8102E', '#1565C0', '#2E7D32', '#E65100',
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 11, fontWeight: 600, color: '#555',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'block', marginBottom: 6,
    }}>
      {children}
    </label>
  )
}

function AccordionHeader({
  title, badge, open, onToggle,
}: {
  title: string
  badge?: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', padding: '9px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: 'none', borderTop: '1px solid #eee',
        background: open ? '#f8f9fa' : '#fff',
        cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#333', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {title}
        {!!badge && (
          <span style={{
            fontSize: 10, backgroundColor: '#C8102E', color: '#fff',
            padding: '1px 6px', borderRadius: 10, fontWeight: 600,
          }}>
            {badge}
          </span>
        )}
      </span>
      <ChevronDown
        size={13}
        style={{
          color: '#888',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}
      />
    </button>
  )
}

interface Props { placedBlock: PlacedBlock }

export function BlockInspector({ placedBlock }: Props) {
  const { updateBlockOverride, removeBlock, resizeBlock, ad } = useAdStore()
  const { selectBlock } = useUIStore()
  const [customHex, setCustomHex] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({
    display: true,
    text: true,
    pricing: true,
    style: false,
  })

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  const page = ad?.sections.flatMap(s => s.pages).find(p => p.id === placedBlock.pageId)
  const pageZones = (page?.template?.layoutJson as TemplateLayout | undefined)?.zones || []
  const zone = pageZones.find(z => z.id === placedBlock.zoneId)

  const feed = placedBlock.blockData?.feedJson
  const overrides = placedBlock.overrides || {}

  const currentMode: DisplayMode = (overrides.displayMode as DisplayMode) || 'product_image'
  const currentBg: string = (overrides.backgroundColor as string) || '#FFFFFF'

  const hasLifestyle = !!feed?.images?.lifestyle
  const hasProduct = !!feed?.images?.product
  const hasBothImages = hasLifestyle && hasProduct

  const handleRemove = () => { removeBlock(placedBlock.id); selectBlock(null) }

  if (!feed) return null

  // Overlay blocks (stamp overlays, sale band overlays) get their own clean inspector
  if (currentMode === 'stamp_overlay' || currentMode === 'sale_band') {
    return <OverlayInspector placedBlock={placedBlock} />
  }

  const hasFeedPriceText = !!(feed as Record<string, unknown>).priceText
  const hasPrice = !!feed.price || !!feed.upc

  // ── Price Circle state ─────────────────────────────────────────────
  const ringColor = (overrides.priceCircleRingColor as string) || '#C8102E'
  const circleBgColor = (overrides.priceCircleBackground as string) || '#FFFAFA'
  const circleVariants = [
    { ring: '#C8102E', bg: '#FFFAFA', label: 'Meijer Red' },
    { ring: '#1565C0', bg: '#F0F7FF', label: 'Blue' },
    { ring: '#2E7D32', bg: '#F1F8E9', label: 'Green' },
    { ring: '#F9A825', bg: '#FFFDE7', label: 'Gold' },
    { ring: '#E65100', bg: '#FFF3E0', label: 'Orange' },
    { ring: '#6A1B9A', bg: '#F3E5F5', label: 'Purple' },
    { ring: '#212121', bg: '#FAFAFA', label: 'Black' },
    { ring: '#FFFFFF', bg: 'rgba(255,255,255,0.12)', label: 'White' },
  ]

  const showPriceCircleControls = !!(overrides.priceCircleOverlay) || currentMode === 'price_circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* ── Product Info (always visible) ── */}
      <div style={{ padding: '10px 12px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>
          {feed.productName}
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          {`UPC: ${feed.upc} · ${feed.category}`}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DISPLAY — mode picker, layout, image source
          (hidden for stamp-only blocks)
          ══════════════════════════════════════════════ */}
      <AccordionHeader title="Display" open={open.display} onToggle={() => toggle('display')} />
      {open.display && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Display Mode */}
          <div>
            <SectionLabel>Display Mode</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {DISPLAY_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => updateBlockOverride(placedBlock.id, { displayMode: m.value })}
                  style={{
                    padding: '5px 8px', border: '1px solid',
                    borderColor: currentMode === m.value ? '#1565C0' : '#ddd',
                    borderRadius: 4,
                    backgroundColor: currentMode === m.value ? '#e3f2fd' : '#fff',
                    color: currentMode === m.value ? '#1565C0' : '#555',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left',
                    fontWeight: currentMode === m.value ? 600 : 400,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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

          {/* Content Layout */}
          {['combo', 'combo_no_price', 'product_image', 'lifestyle_image', 'text_only'].includes(currentMode) && (
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
                        padding: '6px 4px', border: '1px solid',
                        borderColor: active ? '#1565C0' : '#ddd',
                        borderRadius: 5,
                        backgroundColor: active ? '#e3f2fd' : '#fff',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
                        {opt.icon}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#1565C0' : '#555' }}>
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Image Source toggle — only when block has both images */}
          {hasBothImages && !['lifestyle_image', 'text_only', 'text_overlay', 'sale_band'].includes(currentMode) && (
            <div>
              <SectionLabel>Image Source</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {(['product', 'lifestyle'] as const).map(src => {
                  const active = ((overrides.activeImage as string) ?? 'product') === src
                  return (
                    <button
                      key={src}
                      onClick={() => updateBlockOverride(placedBlock.id, { activeImage: src })}
                      style={{
                        padding: '7px 8px', border: '1px solid',
                        borderColor: active ? '#1565C0' : '#ddd',
                        borderRadius: 5,
                        backgroundColor: active ? '#e3f2fd' : '#fff',
                        color: active ? '#1565C0' : '#555',
                        fontSize: 11, fontWeight: active ? 700 : 400,
                        cursor: 'pointer', textTransform: 'capitalize',
                      }}
                    >
                      {src}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TEXT & COPY — hidden for stamp-only blocks
          ══════════════════════════════════════════════ */}
      <AccordionHeader title="Text & Copy" open={open.text} onToggle={() => toggle('text')} />
      {open.text && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div>
            <SectionLabel>Headline</SectionLabel>
            <input
              value={(overrides.headline as string) ?? feed.headline ?? ''}
              onChange={e => updateBlockOverride(placedBlock.id, { headline: e.target.value })}
              style={{
                width: '100%', padding: '6px 8px', border: '1px solid #ddd',
                borderRadius: 4, fontSize: 12, boxSizing: 'border-box', color: '#111',
              }}
            />
          </div>

          <div>
            <SectionLabel>Description</SectionLabel>
            <textarea
              value={(overrides.description as string) || feed.description || ''}
              onChange={e => updateBlockOverride(placedBlock.id, { description: e.target.value })}
              rows={2}
              style={{
                width: '100%', padding: '6px 8px', border: '1px solid #ddd',
                borderRadius: 4, fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {(feed.disclaimer || (overrides.disclaimer as string)) && (
            <div>
              <SectionLabel>Disclaimer</SectionLabel>
              <textarea
                value={(overrides.disclaimer as string) || feed.disclaimer || ''}
                onChange={e => updateBlockOverride(placedBlock.id, { disclaimer: e.target.value })}
                rows={1}
                style={{
                  width: '100%', padding: '6px 8px', border: '1px solid #ddd',
                  borderRadius: 4, fontSize: 11, resize: 'vertical', boxSizing: 'border-box', color: '#777',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PRICING — hidden for stamp-only blocks
          ══════════════════════════════════════════════ */}
      <AccordionHeader title="Pricing" open={open.pricing} onToggle={() => toggle('pricing')} />
      {open.pricing && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Sale Band Price (feed-driven promo price) */}
          {hasFeedPriceText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionLabel>Sale Band Price</SectionLabel>

              <input
                value={(overrides.priceText as string) ?? ((feed as Record<string, unknown>).priceText as string) ?? ''}
                onChange={e => updateBlockOverride(placedBlock.id, { priceText: e.target.value })}
                placeholder="e.g. $3.99 or 2/$5"
                style={{
                  width: '100%', padding: '6px 8px', border: '1px solid #ddd',
                  borderRadius: 4, fontSize: 12, boxSizing: 'border-box', color: '#111',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Font</div>
                  <select
                    value={(overrides.priceFontFamily as string) || ''}
                    onChange={e => updateBlockOverride(placedBlock.id, { priceFontFamily: e.target.value || undefined })}
                    style={{
                      width: '100%', padding: '5px 6px', border: '1px solid #ddd',
                      borderRadius: 4, fontSize: 11, color: '#111', backgroundColor: '#fff',
                    }}
                  >
                    <option value="">Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Georgia', serif">Georgia</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                    <option value="'Courier New', monospace">Courier</option>
                    <option value="'Times New Roman', serif">Times</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Size (px)</div>
                  <input
                    type="number"
                    min={8} max={120} step={1}
                    value={(overrides.priceFontSize as number) ?? ''}
                    placeholder="auto"
                    onChange={e => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      updateBlockOverride(placedBlock.id, { priceFontSize: v })
                    }}
                    style={{
                      width: 64, padding: '5px 6px', border: '1px solid #ddd',
                      borderRadius: 4, fontSize: 11, boxSizing: 'border-box', color: '#111',
                    }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Price Circle */}
          {hasPrice && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Price Circle Overlay</SectionLabel>
                <button
                  onClick={() => updateBlockOverride(placedBlock.id, { priceCircleOverlay: !overrides.priceCircleOverlay })}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    backgroundColor: overrides.priceCircleOverlay ? '#1565C0' : '#ccc',
                    border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, width: 18, height: 18,
                    borderRadius: '50%', backgroundColor: '#fff',
                    left: overrides.priceCircleOverlay ? 20 : 2,
                  }} />
                </button>
              </div>

              {showPriceCircleControls && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* Style swatches */}
                  <div>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 5 }}>Style</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {circleVariants.map(v => {
                        const isActive = ringColor === v.ring && circleBgColor === v.bg
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
                              cursor: 'pointer', flexShrink: 0,
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
                          type="color" value={ringColor}
                          onChange={e => updateBlockOverride(placedBlock.id, { priceCircleRingColor: e.target.value })}
                          style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <input
                          type="text" value={ringColor} maxLength={7}
                          onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateBlockOverride(placedBlock.id, { priceCircleRingColor: e.target.value }) }}
                          style={{ flex: 1, padding: '3px 5px', border: '1px solid #ddd', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Fill color</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="color" value={circleBgColor.startsWith('rgba') ? '#ffffff' : circleBgColor}
                          onChange={e => updateBlockOverride(placedBlock.id, { priceCircleBackground: e.target.value })}
                          style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <input
                          type="text" value={circleBgColor} maxLength={7}
                          onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateBlockOverride(placedBlock.id, { priceCircleBackground: e.target.value }) }}
                          style={{ flex: 1, padding: '3px 5px', border: '1px solid #ddd', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Label text */}
                  <div>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Label text</div>
                    <input
                      type="text"
                      value={(overrides.priceLabel as string) ?? ''}
                      placeholder="sale"
                      onChange={e => updateBlockOverride(placedBlock.id, { priceLabel: e.target.value || undefined })}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, boxSizing: 'border-box', color: '#111' }}
                    />
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
                    <div style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
                      Drag the circle on canvas to reposition
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasFeedPriceText && !hasPrice && (
            <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
              No pricing data for this block
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STYLE — background color
          ══════════════════════════════════════════════ */}
      <AccordionHeader title="Style" open={open.style} onToggle={() => toggle('style')} />
      {open.style && (
        <div style={{ padding: '10px 12px' }}>
          <SectionLabel>Background Color</SectionLabel>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {BG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => updateBlockOverride(placedBlock.id, { backgroundColor: color })}
                title={color}
                style={{
                  width: 22, height: 22, borderRadius: 3,
                  border: currentBg === color ? '2px solid #1565C0' : '1px solid #ccc',
                  backgroundColor: color, cursor: 'pointer', padding: 0,
                  boxShadow: currentBg === color ? '0 0 0 1px #1565C0' : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              width: 22, height: 22, borderRadius: 3, border: '1px solid #ccc',
              backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : currentBg,
              flexShrink: 0,
            }} />
            <input
              type="text"
              placeholder="#RRGGBB"
              maxLength={7}
              value={customHex}
              onChange={e => {
                const v = e.target.value
                setCustomHex(v)
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) updateBlockOverride(placedBlock.id, { backgroundColor: v })
              }}
              style={{
                flex: 1, padding: '4px 8px', border: '1px solid #ddd',
                borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
              }}
            />
            <input
              type="color"
              value={currentBg}
              onChange={e => { setCustomHex(e.target.value); updateBlockOverride(placedBlock.id, { backgroundColor: e.target.value }) }}
              style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ACTIONS — always visible at bottom
          ══════════════════════════════════════════════ */}
      <div style={{
        padding: '12px', borderTop: '1px solid #eee',
        display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto',
      }}>
        {zone && (
          <button
            onClick={() => resizeBlock(placedBlock.id, zone.x, zone.y, zone.width, zone.height)}
            style={{
              width: '100%', padding: '7px', backgroundColor: '#fff',
              border: '1px solid #1565C0', borderRadius: 4, color: '#1565C0',
              cursor: 'pointer', fontSize: 12, display: 'flex',
              alignItems: 'center', gap: 6, justifyContent: 'center', fontWeight: 600,
            }}
          >
            <Maximize2 size={13} />
            Fit to Zone
          </button>
        )}
        <button
          onClick={handleRemove}
          style={{
            width: '100%', padding: '7px', backgroundColor: '#fff',
            border: '1px solid #ffcdd2', borderRadius: 4, color: '#c62828',
            cursor: 'pointer', fontSize: 12, display: 'flex',
            alignItems: 'center', gap: 6, justifyContent: 'center',
          }}
        >
          <Trash2 size={14} />
          Remove from page
        </button>
      </div>

    </div>
  )
}

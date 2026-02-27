'use client'
import React from 'react'
import { PlacedBlock, StampType } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { STAMP_CONFIG } from '@/components/canvas/StampBadge'
import { Trash2 } from 'lucide-react'

const ALL_STAMPS: StampType[] = [
  'SALE', 'BOGO', 'PCT_OFF', 'HOT_DEAL', 'NEW',
  'ORGANIC', 'LOCAL', 'SEASONAL', 'MANAGERS_SPECIAL', 'CLEARANCE',
  'FRESH', 'PICKUP', 'DELIVERY', 'FEATURED',
  'EXCLUSIVE', 'LIMITED', 'DIGITAL_COUPON', 'BUY_MORE',
]

const STAMP_COLOR_PRESETS = [
  '#C8102E', '#1B5E20', '#E65100', '#1565C0',
  '#6A1B9A', '#F57C00', '#4E342E', '#880E4F',
  '#006064', '#4A148C', '#BF360C', '#2E7D32',
]

const BAND_COLOR_PRESETS = [
  '#C8102E', '#1565C0', '#2E7D32', '#212121',
  '#E65100', '#6A1B9A', '#F9A825', '#0D47A1',
]

const SHAPE_OPTIONS = [
  { value: 'circle' as const, label: 'Circle', radius: '50%'   },
  { value: 'square' as const, label: 'Square', radius: '5px'   },
  { value: 'pill'   as const, label: 'Pill',   radius: '999px' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#555',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
    }}>
      {children}
    </div>
  )
}

function ColorPicker({ value, presets, onChange, onReset }: {
  value: string
  presets: string[]
  onChange: (c: string) => void
  onReset?: () => void
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {presets.map(c => (
          <div
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 4, backgroundColor: c, cursor: 'pointer',
              border: value === c ? '2px solid #1565C0' : '2px solid transparent',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: 28, height: 28, padding: 1, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
        />
        <input
          type="text"
          value={value}
          maxLength={7}
          placeholder="#C8102E"
          onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: '#111' }}
        />
        {onReset && (
          <button onClick={onReset} title="Reset to default" style={{ fontSize: 10, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
            ↺
          </button>
        )}
      </div>
    </>
  )
}

interface Props { placedBlock: PlacedBlock }

export function OverlayInspector({ placedBlock }: Props) {
  const { updateBlockOverride, removeBlock } = useAdStore()
  const { selectBlock } = useUIStore()

  const overrides     = placedBlock.overrides || {}
  const displayMode   = overrides.displayMode as string
  const isStamp       = displayMode === 'stamp_overlay'
  const isBand        = displayMode === 'sale_band'

  const stamps        = (overrides.stamps     as StampType[]) || []
  const stampType     = stamps[0] || 'SALE'
  const stampColorMap = (overrides.stampColors as Partial<Record<StampType, string>>)                      || {}
  const stampShapeMap = (overrides.stampShapes as Partial<Record<StampType, 'circle' | 'square' | 'pill'>>) || {}
  const stampTextMap  = (overrides.stampTexts  as Partial<Record<StampType, string>>)                      || {}
  const stampSizeMap  = (overrides.stampSizes  as Partial<Record<StampType, number>>)                      || {}

  const stampColor = stampColorMap[stampType] ?? STAMP_CONFIG[stampType]?.bg ?? '#C8102E'
  const stampShape = stampShapeMap[stampType]
  const stampText  = stampTextMap[stampType]  ?? STAMP_CONFIG[stampType]?.text ?? stampType
  const stampSize  = stampSizeMap[stampType]  ?? 48
  const bandColor  = (overrides.backgroundColor as string) || '#C8102E'

  const setStampType = (newType: StampType) =>
    updateBlockOverride(placedBlock.id, { stamps: [newType] })

  const setStampColor = (color: string) =>
    updateBlockOverride(placedBlock.id, { stampColors: { ...stampColorMap, [stampType]: color } as Partial<Record<StampType, string>> })

  const resetStampColor = () => {
    const next = { ...stampColorMap }
    delete next[stampType]
    updateBlockOverride(placedBlock.id, { stampColors: next as Partial<Record<StampType, string>> })
  }

  const setStampShape = (shape: 'circle' | 'square' | 'pill') => {
    updateBlockOverride(placedBlock.id, {
      stampShapes: {
        ...stampShapeMap,
        [stampType]: stampShape === shape ? undefined : shape,
      } as Partial<Record<StampType, 'circle' | 'square' | 'pill'>>,
    })
  }

  const setStampText = (text: string) =>
    updateBlockOverride(placedBlock.id, { stampTexts: { ...stampTextMap, [stampType]: text } as Partial<Record<StampType, string>> })

  const setStampSize = (size: number) =>
    updateBlockOverride(placedBlock.id, { stampSizes: { ...stampSizeMap, [stampType]: size } as Partial<Record<StampType, number>> })

  const setBandColor = (color: string) =>
    updateBlockOverride(placedBlock.id, { backgroundColor: color })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
          {isStamp ? stampType.replace(/_/g, ' ') : 'Sale Band'}
        </div>
        <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>
          {isStamp ? 'Stamp Overlay' : 'Sale Band Overlay'}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── STAMP TYPE PICKER ──────────────────────────────────── */}
        {isStamp && (
          <div>
            <FieldLabel>Stamp Type</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_STAMPS.map(s => {
                const cfg       = STAMP_CONFIG[s]
                const isActive  = s === stampType
                const cfgShape  = cfg.shape
                const radius    = (cfgShape === 'circle' || cfgShape === 'burst') ? '50%' : 5
                const lines     = cfg.text.split('\n')
                return (
                  <button
                    key={s}
                    title={s.replace(/_/g, ' ')}
                    onClick={() => setStampType(s)}
                    style={{
                      width: 44, height: 44, padding: 2,
                      borderRadius: radius,
                      backgroundColor: cfg.bg,
                      border: isActive ? '3px solid #1565C0' : '2px solid rgba(0,0,0,0.08)',
                      boxShadow: isActive
                        ? '0 0 0 1px #1565C0, 0 2px 6px rgba(0,0,0,0.25)'
                        : '0 1px 4px rgba(0,0,0,0.18)',
                      cursor: 'pointer', position: 'relative', flexShrink: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transition: 'box-shadow 0.12s',
                    }}
                  >
                    {lines.map((line, i) => (
                      <span key={i} style={{
                        color: '#fff', fontSize: 5.5, fontWeight: 900,
                        textTransform: 'uppercase', lineHeight: 1.15,
                        textAlign: 'center', pointerEvents: 'none',
                      }}>
                        {line}
                      </span>
                    ))}
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 14, height: 14, borderRadius: '50%',
                        backgroundColor: '#1565C0', border: '2px solid #fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}>
                        <span style={{ color: '#fff', fontSize: 7, fontWeight: 900, lineHeight: 1 }}>✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── COLOR ─────────────────────────────────────────────── */}
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker
            value={isStamp ? stampColor : bandColor}
            presets={isStamp ? STAMP_COLOR_PRESETS : BAND_COLOR_PRESETS}
            onChange={isStamp ? setStampColor : setBandColor}
            onReset={isStamp && stampColorMap[stampType] ? resetStampColor : undefined}
          />
        </div>

        {/* ── SHAPE (stamps only) ───────────────────────────────── */}
        {isStamp && (
          <div>
            <FieldLabel>Shape</FieldLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {SHAPE_OPTIONS.map(opt => {
                const isActive = stampShape === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStampShape(opt.value)}
                    style={{
                      flex: 1, padding: '5px 4px',
                      border: `1px solid ${isActive ? '#1565C0' : '#ddd'}`,
                      borderRadius: 4,
                      backgroundColor: isActive ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}
                  >
                    <div style={{
                      width: 16, height: 16,
                      backgroundColor: isActive ? '#1565C0' : '#bbb',
                      borderRadius: opt.radius, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 9,
                      color: isActive ? '#1565C0' : '#777',
                      fontWeight: isActive ? 700 : 400,
                    }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SIZE (stamps only) ────────────────────────────────── */}
        {isStamp && (
          <div>
            <FieldLabel>Size</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range" min={20} max={140} step={2} value={stampSize}
                onChange={e => setStampSize(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#C8102E' }}
              />
              <span style={{ fontSize: 11, color: '#555', width: 26, textAlign: 'right', flexShrink: 0 }}>
                {stampSize}
              </span>
            </div>
          </div>
        )}

        {/* ── LABEL TEXT (stamps only) ──────────────────────────── */}
        {isStamp && (
          <div>
            <FieldLabel>Label Text</FieldLabel>
            <textarea
              value={stampText}
              rows={2}
              onChange={e => setStampText(e.target.value)}
              placeholder={STAMP_CONFIG[stampType]?.text}
              style={{
                width: '100%', padding: '5px 7px',
                border: '1px solid #ddd', borderRadius: 4,
                fontSize: 11, resize: 'none', boxSizing: 'border-box',
                color: '#111', fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
              Use a new line for two-line labels
            </div>
          </div>
        )}

        {/* ── BAND FIELDS ───────────────────────────────────────── */}
        {isBand && (
          <>
            <div>
              <FieldLabel>Price Text</FieldLabel>
              <input
                value={(overrides.priceText as string) ?? ''}
                onChange={e => updateBlockOverride(placedBlock.id, { priceText: e.target.value })}
                placeholder="e.g. $3.99 or 2/$5"
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', color: '#111' }}
              />
            </div>

            <div>
              <FieldLabel>Price Label</FieldLabel>
              <input
                value={(overrides.priceLabel as string) ?? ''}
                onChange={e => updateBlockOverride(placedBlock.id, { priceLabel: e.target.value || undefined })}
                placeholder="sale"
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', color: '#111' }}
              />
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                Overrides the italic "sale" label on the price circle
              </div>
            </div>

            <div>
              <FieldLabel>Headline</FieldLabel>
              <input
                value={(overrides.headline as string) || ''}
                onChange={e => updateBlockOverride(placedBlock.id, { headline: e.target.value })}
                placeholder="Sale headline…"
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, boxSizing: 'border-box', color: '#111', marginBottom: 6 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px', gap: 6 }}>
                <select
                  value={(overrides.headlineFontFamily as string) || ''}
                  onChange={e => updateBlockOverride(placedBlock.id, { headlineFontFamily: e.target.value || undefined })}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, color: '#111', backgroundColor: '#fff' }}
                >
                  <option value="">Default font</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                  <option value="'Courier New', monospace">Courier</option>
                  <option value="'Times New Roman', serif">Times</option>
                </select>
                <input
                  type="number" min={8} max={120} step={1}
                  value={(overrides.headlineFontSize as number) ?? ''}
                  placeholder="auto"
                  onChange={e => {
                    const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                    updateBlockOverride(placedBlock.id, { headlineFontSize: v })
                  }}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, boxSizing: 'border-box', color: '#111' }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={(overrides.description as string) || ''}
                rows={2}
                onChange={e => updateBlockOverride(placedBlock.id, { description: e.target.value || undefined })}
                placeholder="Supporting copy…"
                style={{ width: '100%', padding: '5px 7px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, resize: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit', marginBottom: 6 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px', gap: 6 }}>
                <select
                  value={(overrides.descFontFamily as string) || ''}
                  onChange={e => updateBlockOverride(placedBlock.id, { descFontFamily: e.target.value || undefined })}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, color: '#111', backgroundColor: '#fff' }}
                >
                  <option value="">Default font</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                  <option value="'Courier New', monospace">Courier</option>
                  <option value="'Times New Roman', serif">Times</option>
                </select>
                <input
                  type="number" min={7} max={72} step={1}
                  value={(overrides.descFontSize as number) ?? ''}
                  placeholder="auto"
                  onChange={e => {
                    const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                    updateBlockOverride(placedBlock.id, { descFontSize: v })
                  }}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, boxSizing: 'border-box', color: '#111' }}
                />
              </div>
            </div>

            {/* Price font */}
            <div>
              <FieldLabel>Price Font</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px', gap: 6 }}>
                <select
                  value={(overrides.priceFontFamily as string) || ''}
                  onChange={e => updateBlockOverride(placedBlock.id, { priceFontFamily: e.target.value || undefined })}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, color: '#111', backgroundColor: '#fff' }}
                >
                  <option value="">Default font</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                  <option value="'Courier New', monospace">Courier</option>
                  <option value="'Times New Roman', serif">Times</option>
                </select>
                <input
                  type="number" min={8} max={120} step={1}
                  value={(overrides.priceFontSize as number) ?? ''}
                  placeholder="auto"
                  onChange={e => {
                    const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                    updateBlockOverride(placedBlock.id, { priceFontSize: v })
                  }}
                  style={{ width: '100%', padding: '5px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, boxSizing: 'border-box', color: '#111' }}
                />
              </div>
            </div>
          </>
        )}

        <div style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
          {isStamp ? 'Drag on canvas to reposition' : 'Drag on canvas to move'}
        </div>
      </div>

      {/* Delete */}
      <div style={{ padding: '12px', borderTop: '1px solid #eee' }}>
        <button
          onClick={() => { removeBlock(placedBlock.id); selectBlock(null) }}
          style={{
            width: '100%', padding: '7px', backgroundColor: '#fff',
            border: '1px solid #ffcdd2', borderRadius: 4, color: '#c62828',
            cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontWeight: 600,
          }}
        >
          <Trash2 size={13} />
          Remove Overlay
        </button>
      </div>
    </div>
  )
}

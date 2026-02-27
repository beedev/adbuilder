'use client'
import React, { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, Save, Grid,
} from 'lucide-react'
import {
  TemplateZone,
  TemplateLayout,
  ZoneRole,
  SizeVariant,
  TextLayout,
  DisplayMode,
} from '@/types'

// ── Constants ──────────────────────────────────────────────────────────

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 1100
const SCALE = 0.65

const ZONE_COLORS: Record<ZoneRole, string> = {
  hero: 'rgba(255,235,238,0.85)',
  featured: 'rgba(232,245,233,0.85)',
  supporting: 'rgba(227,242,253,0.85)',
  accent: 'rgba(255,243,224,0.85)',
  banner: 'rgba(243,229,245,0.85)',
  callout: 'rgba(252,228,236,0.85)',
}

const ZONE_BORDER_COLORS: Record<ZoneRole, string> = {
  hero: '#ef9a9a',
  featured: '#a5d6a7',
  supporting: '#90caf9',
  accent: '#ffcc80',
  banner: '#ce93d8',
  callout: '#f48fb1',
}

const CATEGORIES = ['hero-feature', 'editorial', 'promotional', 'full-bleed', 'split'] as const
const ROLES: ZoneRole[] = ['hero', 'featured', 'supporting', 'accent', 'banner', 'callout']
const SIZE_VARIANTS: SizeVariant[] = ['hero', 'large', 'medium', 'small']
const TEXT_LAYOUTS: TextLayout[] = ['below', 'overlay-bottom', 'overlay-center', 'left', 'right']
const CONTENT_TYPES: DisplayMode[] = ['product_image', 'lifestyle_image', 'text_only', 'combo']
const BG_SWATCHES = ['#ffffff', '#f5f5f5', '#fff3e0', '#e8f5e9', '#e3f2fd', '#fce4ec', '#1a1a2e', '#C8102E']

// ── Types ──────────────────────────────────────────────────────────────

interface DrawState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface Props {
  /** If provided, we're editing an existing template */
  initialTemplate?: {
    id: string
    name: string
    category: string
    orientation: 'portrait' | 'landscape'
    layoutJson: TemplateLayout
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function makeZone(partial: Partial<TemplateZone> & { x: number; y: number; width: number; height: number }): TemplateZone {
  return {
    id: crypto.randomUUID(),
    role: 'supporting',
    zIndex: 1,
    allowedContentTypes: ['product_image', 'combo'],
    sizeVariant: 'medium',
    textLayout: 'below',
    snapHint: true,
    ...partial,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// ── Component ──────────────────────────────────────────────────────────

export default function TemplateBuilder({ initialTemplate }: Props) {
  const router = useRouter()
  const isEdit = !!initialTemplate

  // ── Form state ────────────────────────────────────────────────────
  const [name, setName] = useState(initialTemplate?.name ?? '')
  const [category, setCategory] = useState(initialTemplate?.category ?? 'promotional')
  const [bgColor, setBgColor] = useState(
    (initialTemplate?.layoutJson.backgroundLayers[0]?.color as string | undefined) ?? '#ffffff'
  )
  const [zones, setZones] = useState<TemplateZone[]>(
    initialTemplate?.layoutJson.zones ?? []
  )
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Drawing state ─────────────────────────────────────────────────
  const [draw, setDraw] = useState<DrawState>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null

  // ── Canvas mouse coordinate helper ────────────────────────────────
  const toCanvasCoords = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: clamp(Math.round((e.clientX - rect.left) / SCALE), 0, CANVAS_WIDTH),
      y: clamp(Math.round((e.clientY - rect.top) / SCALE), 0, CANVAS_HEIGHT),
    }
  }, [])

  // ── Zone drawing handlers ─────────────────────────────────────────
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only start drawing on the canvas background (not on a zone)
      if ((e.target as HTMLElement).dataset.zoneid) return
      const { x, y } = toCanvasCoords(e)
      setDraw({ active: true, startX: x, startY: y, currentX: x, currentY: y })
      setSelectedZoneId(null)
      e.preventDefault()
    },
    [toCanvasCoords]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draw.active) return
      const { x, y } = toCanvasCoords(e)
      setDraw(d => ({ ...d, currentX: x, currentY: y }))
    },
    [draw.active, toCanvasCoords]
  )

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draw.active) return
      const { x, y } = toCanvasCoords(e)
      const rx = Math.min(draw.startX, x)
      const ry = Math.min(draw.startY, y)
      const rw = Math.abs(x - draw.startX)
      const rh = Math.abs(y - draw.startY)

      setDraw({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 })

      if (rw > 30 && rh > 30) {
        const newZone = makeZone({ x: rx, y: ry, width: rw, height: rh })
        setZones(prev => [...prev, newZone])
        setSelectedZoneId(newZone.id)
      }
    },
    [draw, toCanvasCoords]
  )

  // ── Zone selection ────────────────────────────────────────────────
  const handleZoneClick = useCallback(
    (e: React.MouseEvent, zoneId: string) => {
      e.stopPropagation()
      setSelectedZoneId(prev => (prev === zoneId ? null : zoneId))
    },
    []
  )

  // ── Zone property updates ─────────────────────────────────────────
  const updateZone = useCallback(
    (id: string, patch: Partial<TemplateZone>) => {
      setZones(prev => prev.map(z => (z.id === id ? { ...z, ...patch } : z)))
    },
    []
  )

  const deleteZone = useCallback(
    (id: string) => {
      setZones(prev => prev.filter(z => z.id !== id))
      setSelectedZoneId(null)
    },
    []
  )

  const addZone = useCallback(() => {
    const newZone = makeZone({ x: 50, y: 50, width: 200, height: 150 })
    setZones(prev => [...prev, newZone])
    setSelectedZoneId(newZone.id)
  }, [])

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required.')
      return
    }
    setSaving(true)
    setError(null)

    const layout: TemplateLayout = {
      canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      backgroundLayers: [
        {
          id: 'bg',
          type: 'solid',
          x: 0,
          y: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          zIndex: 0,
          color: bgColor,
        },
      ],
      zones,
    }

    try {
      let res: Response
      if (isEdit && initialTemplate) {
        res = await fetch(`/api/templates/${initialTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, layoutJson: layout, orientation: 'portrait' }),
        })
      } else {
        res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, layoutJson: layout }),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }

      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSaving(false)
    }
  }

  // ── Ghost rect for drawing preview ───────────────────────────────
  const ghostRect =
    draw.active
      ? {
          x: Math.min(draw.startX, draw.currentX),
          y: Math.min(draw.startY, draw.currentY),
          w: Math.abs(draw.currentX - draw.startX),
          h: Math.abs(draw.currentY - draw.startY),
        }
      : null

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header
        style={{
          height: 52,
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: '#555',
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <Grid size={18} color="#C8102E" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#C8102E', flexShrink: 0 }}>
          {isEdit ? 'Edit Template' : 'New Template'}
        </span>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name…"
          style={{
            flex: 1,
            maxWidth: 340,
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            outline: 'none',
          }}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        {error && (
          <span style={{ fontSize: 12, color: '#c62828', fontWeight: 600 }}>{error}</span>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            backgroundColor: saving ? '#eee' : '#C8102E',
            color: saving ? '#bbb' : '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar — Zone list */}
        <aside
          style={{
            width: 220,
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '12px 14px 8px',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 11,
              fontWeight: 700,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Zones ({zones.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {zones.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  fontSize: 12,
                  color: '#bbb',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Draw on the canvas or click "Add Zone" to get started.
              </div>
            ) : (
              zones.map((zone, idx) => {
                const isSelected = zone.id === selectedZoneId
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f5f5f5',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#EEF4FF' : '#fff',
                      borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: ZONE_BORDER_COLORS[zone.role],
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>
                        Zone {idx + 1} — {zone.role}
                      </div>
                      <div style={{ fontSize: 10, color: '#999' }}>
                        {zone.width}&times;{zone.height} at ({zone.x}, {zone.y})
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
            <button
              onClick={addZone}
              style={{
                width: '100%',
                padding: '8px 0',
                border: '1px dashed #ccc',
                borderRadius: 6,
                backgroundColor: '#fafafa',
                cursor: 'pointer',
                fontSize: 13,
                color: '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={14} />
              Add Zone
            </button>
          </div>
        </aside>

        {/* Center canvas area */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          {/* Canvas wrapper: keeps shadow and overflow contained */}
          <div
            style={{
              width: CANVAS_WIDTH * SCALE,
              height: CANVAS_HEIGHT * SCALE,
              flexShrink: 0,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* The actual design canvas at full resolution, then scaled */}
            <div
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: bgColor,
                transformOrigin: 'top left',
                transform: `scale(${SCALE})`,
                cursor: draw.active ? 'crosshair' : 'default',
                userSelect: 'none',
              }}
            >
              {/* Rendered zones */}
              {zones.map(zone => {
                const isSelected = zone.id === selectedZoneId
                return (
                  <div
                    key={zone.id}
                    data-zoneid={zone.id}
                    onClick={e => handleZoneClick(e, zone.id)}
                    style={{
                      position: 'absolute',
                      left: zone.x,
                      top: zone.y,
                      width: zone.width,
                      height: zone.height,
                      backgroundColor: ZONE_COLORS[zone.role],
                      border: isSelected
                        ? '2px solid #1976d2'
                        : `1.5px solid ${ZONE_BORDER_COLORS[zone.role]}`,
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      zIndex: zone.zIndex,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: ZONE_BORDER_COLORS[zone.role],
                        pointerEvents: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {zone.role}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: ZONE_BORDER_COLORS[zone.role],
                        pointerEvents: 'none',
                        opacity: 0.75,
                      }}
                    >
                      {zone.width}&times;{zone.height}
                    </div>
                  </div>
                )
              })}

              {/* Ghost rectangle while drawing */}
              {ghostRect && ghostRect.w > 4 && ghostRect.h > 4 && (
                <div
                  style={{
                    position: 'absolute',
                    left: ghostRect.x,
                    top: ghostRect.y,
                    width: ghostRect.w,
                    height: ghostRect.h,
                    border: '2px dashed #1976d2',
                    backgroundColor: 'rgba(25,118,210,0.08)',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                    zIndex: 999,
                  }}
                />
              )}
            </div>
          </div>
        </main>

        {/* Right panel — Properties */}
        <aside
          style={{
            width: 260,
            backgroundColor: '#fff',
            borderLeft: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          {/* Background color picker — always visible */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Canvas Background
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BG_SWATCHES.map(swatch => (
                <div
                  key={swatch}
                  onClick={() => setBgColor(swatch)}
                  title={swatch}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: swatch,
                    border: bgColor === swatch ? '2px solid #1976d2' : '1.5px solid #ccc',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                title="Custom color"
                style={{
                  width: 24,
                  height: 24,
                  border: '1.5px solid #ccc',
                  borderRadius: 4,
                  padding: 0,
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          {/* Zone properties */}
          {selectedZone ? (
            <ZoneProperties
              zone={selectedZone}
              onUpdate={patch => updateZone(selectedZone.id, patch)}
              onDelete={() => deleteZone(selectedZone.id)}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                color: '#bbb',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 1.7,
              }}
            >
              <Grid size={32} color="#e0e0e0" style={{ marginBottom: 12 }} />
              Select a zone to edit its properties, or draw a new zone on the canvas.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

// ── ZoneProperties sub-component ───────────────────────────────────────

function ZoneProperties({
  zone,
  onUpdate,
  onDelete,
}: {
  zone: TemplateZone
  onUpdate: (patch: Partial<TemplateZone>) => void
  onDelete: () => void
}) {
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 13,
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: '#777',
    display: 'block',
    marginBottom: 4,
  }

  const rowStyle: React.CSSProperties = {
    marginBottom: 12,
  }

  return (
    <div style={{ padding: '14px 16px', flex: 1 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 14,
        }}
      >
        Zone Properties
      </div>

      {/* Position & size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {(['x', 'y', 'width', 'height'] as const).map(field => (
          <div key={field}>
            <label style={labelStyle}>{field.toUpperCase()}</label>
            <input
              type="number"
              value={zone[field]}
              min={0}
              max={field === 'x' || field === 'width' ? CANVAS_WIDTH : CANVAS_HEIGHT}
              onChange={e => onUpdate({ [field]: Number(e.target.value) })}
              style={fieldStyle}
            />
          </div>
        ))}
      </div>

      {/* Role */}
      <div style={rowStyle}>
        <label style={labelStyle}>Role</label>
        <select
          value={zone.role}
          onChange={e => onUpdate({ role: e.target.value as ZoneRole })}
          style={fieldStyle}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Size Variant */}
      <div style={rowStyle}>
        <label style={labelStyle}>Size Variant</label>
        <select
          value={zone.sizeVariant}
          onChange={e => onUpdate({ sizeVariant: e.target.value as SizeVariant })}
          style={fieldStyle}
        >
          {SIZE_VARIANTS.map(v => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Text Layout */}
      <div style={rowStyle}>
        <label style={labelStyle}>Text Layout</label>
        <select
          value={zone.textLayout}
          onChange={e => onUpdate({ textLayout: e.target.value as TextLayout })}
          style={fieldStyle}
        >
          {TEXT_LAYOUTS.map(tl => (
            <option key={tl} value={tl}>
              {tl}
            </option>
          ))}
        </select>
      </div>

      {/* Allowed Content */}
      <div style={rowStyle}>
        <label style={labelStyle}>Allowed Content</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CONTENT_TYPES.map(ct => (
            <label
              key={ct}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#444',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={zone.allowedContentTypes.includes(ct)}
                onChange={e => {
                  const current = zone.allowedContentTypes
                  if (e.target.checked) {
                    onUpdate({ allowedContentTypes: [...current, ct] })
                  } else {
                    onUpdate({ allowedContentTypes: current.filter(c => c !== ct) })
                  }
                }}
              />
              {ct.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <button
          onClick={onDelete}
          style={{
            width: '100%',
            padding: '8px 0',
            border: '1px solid #ffcdd2',
            borderRadius: 6,
            backgroundColor: '#fff5f5',
            color: '#c62828',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Trash2 size={14} />
          Delete Zone
        </button>
      </div>
    </div>
  )
}

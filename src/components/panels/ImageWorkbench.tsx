'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { X, Plus, Trash2, Loader2, Image as ImageIcon, ChevronDown, ChevronUp, Move } from 'lucide-react'
import { useAdStore } from '@/stores/adStore'
import { WorkbenchLayer } from '@/types'
import { ImagePickerGallery } from './ImagePickerGallery'

const MAX_LAYERS = 4

// ── Slider ───────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number
  step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 44px', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
      />
      <span style={{
        fontSize: 11, color: '#222', textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', fontWeight: 600,
      }}>
        {value}{unit}
      </span>
    </div>
  )
}

// ── Layer thumbnail ───────────────────────────────────────────
function LayerThumb({ url }: { url?: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
      backgroundColor: '#f0f0f0', border: '1px solid #e0e0e0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <ImageIcon size={16} color="#ccc" />
      }
    </div>
  )
}

interface Props { blockId: string; onClose: () => void }

export function ImageWorkbench({ blockId, onClose }: Props) {
  const { ad, updateBlockOverride } = useAdStore()

  const block = ad?.vehicles
    .flatMap(v => v.pages.flatMap(p => p.placedBlocks))
    .find(b => b.id === blockId) ?? null

  const productName =
    (block?.blockData?.feedJson as Record<string, unknown> | undefined)
      ?.productName as string | undefined ?? ''

  // ── State ────────────────────────────────────────────────────
  const [bgUrl, setBgUrl]     = useState<string | null>(block?.overrides.imageUrl ?? null)
  const [bgColor, setBgColor] = useState<string>(block?.overrides.workbenchBgColor ?? '#ffffff')
  const [layers, setLayers]   = useState<WorkbenchLayer[]>(block?.overrides.foregroundLayers ?? [])
  const [rendering, setRendering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // active: null = background, 0..n-1 = foreground index
  const [active, setActive] = useState<number | null>(null)
  // whether the image picker in the active section is expanded
  const [pickerOpen, setPickerOpen] = useState(false)

  // drag state stored in ref (avoids stale closures)
  const dragStart = useRef<{ mouseX: number; mouseY: number; layerX: number; layerY: number } | null>(null)

  // close picker when switching layers
  const switchActive = (next: number | null) => {
    setActive(next)
    setPickerOpen(false)
  }

  // ── Canvas ───────────────────────────────────────────────────
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const imgCache   = useRef(new Map<string, HTMLImageElement>())
  const blockW     = block?.width  ?? 200
  const blockH     = block?.height ?? 200

  // responsive preview: max 560px wide, height proportional
  const PREVIEW_W = 560
  const PREVIEW_H = Math.round(PREVIEW_W * (blockH / blockW))

  const loadImg = useCallback((url: string): Promise<HTMLImageElement> => {
    if (imgCache.current.has(url)) return Promise.resolve(imgCache.current.get(url)!)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => { imgCache.current.set(url, img); resolve(img) }
      img.onerror = () => reject(new Error(`Failed to load ${url}`))
      img.src = url
    })
  }, [])

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = PREVIEW_W
    canvas.height = PREVIEW_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H)

    // Solid background color
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H)

    // Background image — cover fill
    if (bgUrl) {
      try {
        const img = await loadImg(bgUrl)
        const s = Math.max(PREVIEW_W / img.naturalWidth, PREVIEW_H / img.naturalHeight)
        const w = img.naturalWidth * s, h = img.naturalHeight * s
        ctx.drawImage(img, (PREVIEW_W - w) / 2, (PREVIEW_H - h) / 2, w, h)
      } catch { /* ignore */ }
    }

    // Foreground layers
    for (const layer of layers.filter(l => l.url)) {
      try {
        const img = await loadImg(layer.url)
        const cx = (layer.x / 100) * PREVIEW_W
        const cy = (layer.y / 100) * PREVIEW_H
        const w  = img.naturalWidth  * (layer.scale / 100)
        const h  = img.naturalHeight * (layer.scale / 100)
        ctx.save()
        ctx.globalAlpha = layer.opacity
        ctx.translate(cx, cy)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
        ctx.restore()
      } catch { /* ignore */ }
    }
  }, [bgUrl, bgColor, layers, PREVIEW_W, PREVIEW_H, loadImg])

  useEffect(() => { drawCanvas() }, [drawCanvas])

  // ── Layer helpers ────────────────────────────────────────────
  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return
    const idx = layers.length
    setLayers(l => [...l, { url: '', opacity: 1, scale: 30, rotation: 0, x: 50, y: 50 }])
    switchActive(idx)
    setPickerOpen(true)
  }

  const updateLayer = (i: number, patch: Partial<WorkbenchLayer>) =>
    setLayers(l => l.map((x, j) => j === i ? { ...x, ...patch } : x))

  const removeLayer = (i: number) => {
    setLayers(l => l.filter((_, j) => j !== i))
    if (active === i) switchActive(null)
    else if (active !== null && active > i) setActive(active - 1)
  }

  // ── Canvas drag to reposition active foreground layer ────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (active === null) return // background = no drag
    const layer = layers[active]
    if (!layer) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragStart.current = {
      mouseX: (e.clientX - rect.left) / rect.width * 100,
      mouseY: (e.clientY - rect.top)  / rect.height * 100,
      layerX: layer.x,
      layerY: layer.y,
    }
    setIsDragging(true)
    e.preventDefault()

    const canvas = e.currentTarget

    const onMove = (mv: MouseEvent) => {
      if (!dragStart.current) return
      const r = canvas.getBoundingClientRect()
      const mx = (mv.clientX - r.left) / r.width  * 100
      const my = (mv.clientY - r.top)  / r.height * 100
      const newX = Math.max(0, Math.min(100, dragStart.current.layerX + mx - dragStart.current.mouseX))
      const newY = Math.max(0, Math.min(100, dragStart.current.layerY + my - dragStart.current.mouseY))
      setLayers(prev => prev.map((l, j) => j === active ? { ...l, x: newX, y: newY } : l))
    }

    const onUp = () => {
      setIsDragging(false)
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Apply ────────────────────────────────────────────────────
  const apply = async () => {
    setRendering(true)
    await drawCanvas()
    const dataUrl = canvasRef.current?.toDataURL('image/png') ?? undefined
    updateBlockOverride(blockId, {
      imageUrl: dataUrl,
      foregroundLayers: layers.filter(l => l.url),
      workbenchBgColor: bgColor,
    })
    setRendering(false)
    onClose()
  }

  // ── Derived active-layer info ────────────────────────────────
  const isBackground  = active === null
  const activeLayer   = active !== null ? layers[active] : null
  const activeImgUrl  = isBackground ? (bgUrl ?? undefined) : (activeLayer?.url || undefined)
  const activeLabel   = isBackground ? 'Background' : `Layer ${active! + 1}`

  // canvas display height (capped so panel doesn't feel cramped)
  const displayH = Math.min(PREVIEW_H, 300)
  const displayW = Math.round(displayH * (blockW / blockH))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 199 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0,
        width: 640, height: '100vh',
        backgroundColor: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
          height: 56,
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111', letterSpacing: '-0.01em' }}>
              Image Workbench
            </span>
            {productName && (
              <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                {productName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#aaa', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── Canvas preview — full width ── */}
          <div style={{
            backgroundColor: '#1a1a1a',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '24px 20px',
            flexShrink: 0,
          }}>
            {/* canvas + drag overlay wrapper */}
            <div style={{ position: 'relative', width: displayW, height: displayH, flexShrink: 0 }}>
              <canvas
                ref={canvasRef}
                width={PREVIEW_W}
                height={PREVIEW_H}
                onMouseDown={handleCanvasMouseDown}
                style={{
                  display: 'block',
                  width: displayW,
                  height: displayH,
                  borderRadius: 6,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  cursor: active !== null
                    ? (isDragging ? 'grabbing' : 'grab')
                    : 'default',
                  userSelect: 'none',
                }}
              />

              {/* Active layer position dot */}
              {active !== null && layers[active] && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${layers[active].x}%`,
                    top:  `${layers[active].y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 12, height: 12,
                    borderRadius: '50%',
                    border: '2.5px solid #fff',
                    backgroundColor: '#2563EB',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}

              {/* Drag hint — shown when foreground layer active */}
              {active !== null && !isDragging && (
                <div style={{
                  position: 'absolute', bottom: 8, left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: '#fff', fontSize: 10, fontWeight: 500,
                  padding: '3px 8px', borderRadius: 20,
                  display: 'flex', alignItems: 'center', gap: 4,
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>
                  <Move size={10} /> Drag to reposition
                </div>
              )}
            </div>
          </div>

          {/* ── Layer stack ── */}
          <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#999',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Layers
              </span>
              {layers.length < MAX_LAYERS && (
                <button
                  onClick={addLayer}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: '#2563EB', fontWeight: 600,
                    background: 'none', border: '1.5px solid #2563EB',
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  <Plus size={11} /> Add Layer
                </button>
              )}
            </div>

            {/* Background row */}
            <LayerRow
              label="Background"
              sublabel="fill"
              thumb={bgUrl ?? undefined}
              isActive={active === null}
              onClick={() => switchActive(null)}
            />

            {/* Foreground layer rows */}
            {layers.map((layer, i) => (
              <LayerRow
                key={i}
                label={`Layer ${i + 1}`}
                sublabel={layer.url ? 'image set' : 'no image'}
                thumb={layer.url || undefined}
                isActive={active === i}
                onClick={() => switchActive(i)}
                onRemove={() => removeLayer(i)}
              />
            ))}

            {layers.length === 0 && (
              <div style={{
                fontSize: 12, color: '#bbb', padding: '12px 0 4px',
                textAlign: 'center',
              }}>
                Click <strong>Add Layer</strong> to composite a foreground image
              </div>
            )}
          </div>

          {/* ── Active layer editor ── */}
          <div style={{
            margin: '16px 20px',
            border: '1px solid #e8e8e8',
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {/* Editor header */}
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#f8f8f8',
              borderBottom: '1px solid #eeeeee',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>
                {activeLabel}
              </span>
              <span style={{ fontSize: 11, color: '#aaa' }}>
                {isBackground ? 'Cover fill — no transform' : 'Position, scale & rotate'}
              </span>
            </div>

            {/* Background color row — only for background layer */}
            {isBackground && (
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #eee',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 11, color: '#888', width: 80, flexShrink: 0 }}>Canvas color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  {/* Quick presets */}
                  {['#ffffff', '#f5f5f0', '#000000', '#1a1a2e', '#fef9ef', '#e8f4fd'].map(c => (
                    <div
                      key={c}
                      onClick={() => setBgColor(c)}
                      style={{
                        width: 20, height: 20, borderRadius: 4, cursor: 'pointer',
                        backgroundColor: c,
                        border: bgColor === c ? '2px solid #2563EB' : '1.5px solid #d0d0d0',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  {/* Custom color input */}
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    style={{
                      width: 24, height: 24, padding: 1, border: '1.5px solid #d0d0d0',
                      borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Image row — current image + change / set button */}
            <div style={{ padding: '12px 14px', borderBottom: pickerOpen ? '1px solid #eee' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <LayerThumb url={activeImgUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {activeImgUrl
                    ? <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Image set
                      </div>
                    : <div style={{ fontSize: 11, color: '#aaa' }}>No image selected</div>
                  }
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {activeImgUrl && (
                    <button
                      onClick={() => {
                        if (isBackground) setBgUrl(null)
                        else updateLayer(active!, { url: '' })
                        setPickerOpen(false)
                      }}
                      style={{
                        fontSize: 11, color: '#e53e3e',
                        background: 'none', border: '1px solid #fed7d7',
                        borderRadius: 5, padding: '4px 9px', cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setPickerOpen(p => !p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#2563EB', fontWeight: 600,
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
                    }}
                  >
                    {activeImgUrl ? 'Change' : 'Choose Image'}
                    {pickerOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable image picker */}
            {pickerOpen && (
              <div style={{ padding: '0 14px 12px', backgroundColor: '#fafafa' }}>
                <ImagePickerGallery
                  productName={productName}
                  currentImageUrl={activeImgUrl}
                  onSelect={url => {
                    if (isBackground) setBgUrl(url)
                    else updateLayer(active!, { url })
                    setPickerOpen(false)
                  }}
                  onClear={() => {
                    if (isBackground) setBgUrl(null)
                    else updateLayer(active!, { url: '' })
                    setPickerOpen(false)
                  }}
                />
              </div>
            )}

            {/* Transform sliders — only for foreground layers */}
            {!isBackground && activeLayer && (
              <div style={{
                padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 10,
                borderTop: '1px solid #eee',
                backgroundColor: '#fff',
              }}>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Move size={10} /> Position by dragging on the preview above
                </div>
                <Slider label="Scale"    value={activeLayer.scale}    min={5}   max={300} step={1}  unit="%" onChange={v => updateLayer(active!, { scale: v })} />
                <Slider label="Rotation" value={activeLayer.rotation} min={-180} max={180} step={1} unit="°" onChange={v => updateLayer(active!, { rotation: v })} />
                <Slider label="Opacity"  value={Math.round(activeLayer.opacity * 100)} min={5} max={100} step={1} unit="%" onChange={v => updateLayer(active!, { opacity: v / 100 })} />
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid #f0f0f0',
          padding: '12px 20px',
          flexShrink: 0,
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          backgroundColor: '#fafafa',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 7,
              border: '1px solid #e0e0e0', backgroundColor: '#fff',
              fontSize: 13, cursor: 'pointer', color: '#555', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={rendering}
            style={{
              padding: '8px 22px', borderRadius: 7,
              border: 'none', backgroundColor: '#2563EB',
              fontSize: 13, fontWeight: 600, cursor: rendering ? 'wait' : 'pointer',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: 7,
              opacity: rendering ? 0.7 : 1,
            }}
          >
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', opacity: rendering ? 1 : 0 }} />
            {rendering ? 'Applying…' : 'Apply to Block'}
          </button>
        </div>

      </div>
    </>
  )
}

// ── Layer row ─────────────────────────────────────────────────
function LayerRow({
  label, sublabel, thumb, isActive, onClick, onRemove,
}: {
  label: string
  sublabel: string
  thumb?: string
  isActive: boolean
  onClick: () => void
  onRemove?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px',
        marginBottom: 4,
        borderRadius: 8,
        cursor: 'pointer',
        backgroundColor: isActive ? '#EFF6FF' : 'transparent',
        border: isActive ? '1.5px solid #BFDBFE' : '1.5px solid transparent',
        transition: 'background 0.1s',
      }}
    >
      <LayerThumb url={thumb} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#1D4ED8' : '#333' }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{sublabel}</div>
      </div>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

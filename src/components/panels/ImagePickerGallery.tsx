'use client'
import React, { useEffect, useRef, useState } from 'react'
import { ImageOff, Check, Loader2, Link2, Upload, Search } from 'lucide-react'

interface ProductImage {
  url: string
  label: string
}

type Tab = 'search' | 'url' | 'upload'

interface Props {
  productName: string
  currentImageUrl?: string
  onSelect: (url: string) => void
  onClear: () => void
}

async function searchProductImages(productName: string): Promise<ProductImage[]> {
  const res = await fetch(
    `/api/image-search?q=${encodeURIComponent(productName)}`,
    { signal: AbortSignal.timeout(12000) }
  )
  if (!res.ok) return []
  return res.json()
}

// ── Tab pill ────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 6, border: 'none',
        backgroundColor: active ? '#2563EB' : 'transparent',
        color: active ? '#fff' : '#888',
        fontSize: 11, fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'background 0.1s',
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Search tab ──────────────────────────────────────────────────────
function SearchTab({ productName, currentImageUrl, onSelect }: Omit<Props, 'onClear'>) {
  const [images, setImages]   = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [query, setQuery]     = useState(productName)

  const runSearch = (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setError(false)
    setImages([])
    searchProductImages(q)
      .then(imgs => { setImages(imgs); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { runSearch(productName) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Custom search bar */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch(query)}
          placeholder="Search for images…"
          style={{
            flex: 1, padding: '6px 10px', fontSize: 11,
            border: '1px solid #e0e0e0', borderRadius: 6,
            outline: 'none', color: '#333',
          }}
        />
        <button
          onClick={() => runSearch(query)}
          disabled={loading}
          style={{
            padding: '6px 10px', borderRadius: 6,
            border: 'none', backgroundColor: '#2563EB',
            color: '#fff', fontSize: 11, fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            flexShrink: 0,
          }}
        >
          {loading
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : <Search size={12} />}
          Search
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: '#aaa' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11 }}>Searching…</span>
        </div>
      ) : (error || images.length === 0) ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 6, padding: '14px 0', color: '#bbb',
        }}>
          <ImageOff size={22} />
          <span style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
            No images found for &ldquo;{query}&rdquo;
          </span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {images.map((img, i) => {
            const isActive = currentImageUrl === img.url
            return (
              <button
                key={i}
                onClick={() => onSelect(img.url)}
                title={img.label}
                style={{
                  padding: 4, border: '2px solid',
                  borderColor: isActive ? '#1565C0' : '#e0e0e0',
                  borderRadius: 6,
                  backgroundColor: isActive ? '#e3f2fd' : '#fafafa',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    backgroundColor: '#1565C0', borderRadius: '50%',
                    width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <img
                  src={img.url}
                  alt={img.label}
                  style={{ width: '100%', height: 76, objectFit: 'contain', borderRadius: 3 }}
                  onError={e => {
                    const el = e.currentTarget.parentElement
                    if (el) el.style.display = 'none'
                  }}
                />
                <span style={{
                  fontSize: 9, color: isActive ? '#1565C0' : '#888',
                  fontWeight: isActive ? 700 : 400,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', width: '100%', textAlign: 'center',
                }}>
                  {img.label.length > 20 ? img.label.slice(0, 18) + '…' : img.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── URL tab ─────────────────────────────────────────────────────────
function UrlTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [url, setUrl]       = useState('')
  const [preview, setPreview] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const tryPreview = (val: string) => {
    setUrl(val)
    if (!val.trim()) { setPreview('idle'); return }
    setPreview('loading')
  }

  const handleUse = () => {
    if (!url.trim()) return
    onSelect(url.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
        Paste any image URL — from Wikimedia, CDN, or any publicly accessible source.
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={url}
          onChange={e => tryPreview(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUse()}
          placeholder="https://…"
          style={{
            flex: 1, padding: '7px 10px', fontSize: 11,
            border: '1px solid #e0e0e0', borderRadius: 6,
            outline: 'none', color: '#333',
          }}
        />
        <button
          onClick={handleUse}
          disabled={!url.trim()}
          style={{
            padding: '7px 12px', borderRadius: 6,
            border: 'none', backgroundColor: url.trim() ? '#2563EB' : '#e0e0e0',
            color: url.trim() ? '#fff' : '#aaa',
            fontSize: 11, fontWeight: 600,
            cursor: url.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}
        >
          Use URL
        </button>
      </div>

      {/* Preview */}
      {url.trim() && (
        <div style={{
          border: '1px solid #e0e0e0', borderRadius: 8,
          backgroundColor: '#f8f8f8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 120, overflow: 'hidden',
        }}>
          {preview === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#e53e3e' }}>
              <ImageOff size={20} />
              <span style={{ fontSize: 10 }}>Could not load image</span>
            </div>
          ) : (
            <img
              src={url.trim()}
              alt="preview"
              crossOrigin="anonymous"
              onLoad={() => setPreview('ok')}
              onError={() => setPreview('error')}
              style={{
                maxWidth: '100%', maxHeight: '100%',
                objectFit: 'contain',
                opacity: preview === 'loading' ? 0 : 1,
                transition: 'opacity 0.2s',
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Upload tab ───────────────────────────────────────────────────────
function UploadTab({ onSelect }: { onSelect: (url: string) => void }) {
  const inputRef        = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      onSelect(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          processFile(e.dataTransfer.files[0])
        }}
        style={{
          border: `2px dashed ${dragging ? '#2563EB' : '#d0d0d0'}`,
          borderRadius: 10,
          backgroundColor: dragging ? '#EFF6FF' : '#fafafa',
          padding: '24px 16px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Upload size={22} color={dragging ? '#2563EB' : '#bbb'} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: dragging ? '#2563EB' : '#555' }}>
            {dragging ? 'Drop to upload' : 'Click or drag & drop'}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
            PNG, JPG, GIF, WEBP, SVG
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => processFile(e.target.files?.[0])}
        />
      </div>

      {/* Preview after upload */}
      {preview && (
        <div style={{
          border: '1px solid #d1fae5', borderRadius: 8,
          backgroundColor: '#f0fdf4',
          padding: 6,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img
            src={preview}
            alt="uploaded"
            style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Uploaded</div>
            <div style={{ fontSize: 10, color: '#4ade80', marginTop: 1 }}>Image applied to layer</div>
          </div>
          <Check size={16} color="#16a34a" />
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
export function ImagePickerGallery({ productName, currentImageUrl, onSelect, onClear }: Props) {
  const [tab, setTab] = useState<Tab>('search')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2,
        backgroundColor: '#f0f0f0',
        borderRadius: 8, padding: 3,
      }}>
        <TabBtn active={tab === 'search'} onClick={() => setTab('search')} icon={<Search size={11} />} label="Search" />
        <TabBtn active={tab === 'url'}    onClick={() => setTab('url')}    icon={<Link2 size={11} />}  label="URL" />
        <TabBtn active={tab === 'upload'} onClick={() => setTab('upload')} icon={<Upload size={11} />} label="Upload" />
      </div>

      {/* Tab content */}
      {tab === 'search' && (
        <SearchTab productName={productName} currentImageUrl={currentImageUrl} onSelect={onSelect} />
      )}
      {tab === 'url' && (
        <UrlTab onSelect={url => { onSelect(url); }} />
      )}
      {tab === 'upload' && (
        <UploadTab onSelect={url => { onSelect(url); }} />
      )}

    </div>
  )
}

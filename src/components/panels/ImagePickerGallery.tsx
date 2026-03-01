'use client'
import React, { useEffect, useState } from 'react'
import { ImageOff, Check, Loader2 } from 'lucide-react'

interface ProductImage {
  url: string
  label: string
}

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

export function ImagePickerGallery({ productName, currentImageUrl, onSelect, onClear }: Props) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!productName) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(false)
    setImages([])

    searchProductImages(productName)
      .then(imgs => {
        if (!cancelled) { setImages(imgs); setLoading(false) }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [productName])

  if (!productName) {
    return (
      <div style={{ fontSize: 11, color: '#aaa', padding: '6px 0' }}>
        No product name for this block
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: '#aaa' }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 11 }}>Searching for images…</span>
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, padding: '14px 0', color: '#bbb',
      }}>
        <ImageOff size={22} />
        <span style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
          No images found for &ldquo;{productName}&rdquo;
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {currentImageUrl && (
        <button
          onClick={onClear}
          style={{
            fontSize: 10, color: '#999', border: 'none', background: 'none',
            cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline',
          }}
        >
          Clear image override
        </button>
      )}

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
    </div>
  )
}

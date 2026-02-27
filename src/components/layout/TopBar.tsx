'use client'
import React from 'react'
import { Ad } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { usePriceStore } from '@/stores/priceStore'
import { Save, Eye, Send, RotateCcw, RotateCw, Store, FileDown } from 'lucide-react'

const REGIONS = ['WEST_COAST', 'MIDWEST', 'EAST_COAST']

interface Props {
  ad: Ad
  onSave: () => void
  onSubmit: () => void
  isSaving?: boolean
}

export function TopBar({ ad, onSave, onSubmit, isSaving }: Props) {
  const { undo, redo, history, historyIndex, isDirty, lastSaved } = useAdStore()
  const { togglePreview } = useUIStore()
  const { activeRegion, setRegion } = usePriceStore()
  const [isExporting, setIsExporting] = React.useState(false)

  async function handleExportPdf() {
    if (isExporting) return
    setIsExporting(true)
    try {
      const res = await fetch(`/api/ads/${ad.id}/export/pdf`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'PDF export failed. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-ad-${ad.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const statusColors: Record<string, string> = {
    draft: '#888',
    in_review: '#F57C00',
    approved: '#2E7D32',
    published: '#1565C0',
  }

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
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
        zIndex: 100,
      }}
    >
      {/* Logo / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Store size={20} color="#C8102E" />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#C8102E' }}>Ad Builder</span>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: '#e0e0e0' }} />

      {/* Ad name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ad.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: statusColors[ad.status] || '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {ad.status.replace('_', ' ')}
          </span>
          {isDirty && (
            <span style={{ fontSize: 10, color: '#aaa' }}>&bull; Unsaved changes</span>
          )}
          {!isDirty && lastSaved && (
            <span style={{ fontSize: 10, color: '#bbb' }}>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Region selector */}
      <select
        value={activeRegion}
        onChange={e => setRegion(e.target.value)}
        style={{
          fontSize: 12,
          padding: '4px 8px',
          border: '1px solid #ddd',
          borderRadius: 4,
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
      >
        {REGIONS.map(r => (
          <option key={r} value={r}>
            {r.replace('_', ' ')}
          </option>
        ))}
      </select>

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: 4,
            backgroundColor: 'transparent',
            cursor: canUndo ? 'pointer' : 'default',
            opacity: canUndo ? 1 : 0.3,
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: 4,
            backgroundColor: 'transparent',
            cursor: canRedo ? 'pointer' : 'default',
            opacity: canRedo ? 1 : 0.3,
          }}
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: '#e0e0e0' }} />

      {/* Actions */}
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        title="Download as PDF"
        style={{
          padding: '6px 14px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: 6,
          cursor: isExporting ? 'default' : 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: isExporting ? '#bbb' : '#555',
          opacity: isExporting ? 0.7 : 1,
        }}
      >
        <FileDown size={15} />
        {isExporting ? 'Exporting…' : 'Export PDF'}
      </button>

      <button
        onClick={togglePreview}
        style={{
          padding: '6px 14px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#555',
        }}
      >
        <Eye size={15} />
        Preview
      </button>

      <button
        onClick={onSave}
        disabled={isSaving || !isDirty}
        style={{
          padding: '6px 14px',
          backgroundColor: isDirty ? '#fff' : '#f5f5f5',
          border: '1px solid',
          borderColor: isDirty ? '#1565C0' : '#ddd',
          borderRadius: 6,
          cursor: isDirty ? 'pointer' : 'default',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: isDirty ? '#1565C0' : '#bbb',
          fontWeight: isDirty ? 600 : 400,
        }}
      >
        <Save size={15} />
        {isSaving ? 'Saving\u2026' : 'Save'}
      </button>

      {ad.status === 'draft' && (
        <button
          onClick={onSubmit}
          style={{
            padding: '6px 14px',
            backgroundColor: '#C8102E',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          <Send size={15} />
          Submit for Review
        </button>
      )}
    </header>
  )
}

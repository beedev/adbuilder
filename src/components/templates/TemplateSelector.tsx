'use client'
import React, { useState } from 'react'
import { Template, TemplateLayout } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { X, Plus, RefreshCw } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  'hero-feature': 'Hero Feature',
  editorial: 'Editorial',
  promotional: 'Promotional',
  'full-bleed': 'Full Bleed',
  split: 'Split',
}

interface Props {
  pageId: string
}

export function TemplateSelector({ pageId }: Props) {
  const { templates, setTemplates, swapTemplate, ad } = useAdStore()
  const { closeTemplateSelector } = useUIStore()
  const [refreshing, setRefreshing] = useState(false)

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreateTemplate = () => {
    window.open('/templates/new', '_blank')
  }

  const handleSelect = async (templateId: string) => {
    swapTemplate(pageId, templateId)
    if (ad) {
      await fetch(`/api/ads/${ad.id}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      }).catch(console.error)
    }
    closeTemplateSelector()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) closeTemplateSelector()
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          width: 720,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>Choose Template</span>

          {/* Refresh — picks up templates created in another tab */}
          <button
            onClick={handleRefresh}
            title="Refresh template list"
            style={{
              background: 'none', border: '1px solid #e0e0e0', borderRadius: 6,
              cursor: 'pointer', padding: '5px 8px', color: '#666',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {/* Create new template — opens the template builder in a new tab */}
          <button
            onClick={handleCreateTemplate}
            style={{
              background: '#C8102E', border: 'none', borderRadius: 6,
              cursor: 'pointer', padding: '6px 12px', color: '#fff',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Create Template
          </button>

          <button
            onClick={closeTemplateSelector}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {Object.entries(grouped).map(([category, tmplList]) => (
            <div key={category} style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {tmplList.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.id)}
                    style={{
                      width: 140,
                      border: '2px solid #e0e0e0',
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      padding: 0,
                      overflow: 'hidden',
                      transition: 'border-color 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = '#C8102E'
                      el.style.transform = 'scale(1.02)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = '#e0e0e0'
                      el.style.transform = 'scale(1)'
                    }}
                  >
                    <TemplateThumbnail template={template} />
                    <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#333',
                          textAlign: 'left',
                        }}
                      >
                        {template.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', textAlign: 'left', marginTop: 2 }}>
                        {(template.layoutJson as TemplateLayout).zones?.length || 0} zones &middot;{' '}
                        {template.orientation}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplateThumbnail({ template }: { template: Template }) {
  const layout = template.layoutJson as TemplateLayout
  const canvas = layout?.canvas || { width: 800, height: 1100 }
  const scale = 130 / canvas.width
  const th = canvas.height * scale

  const zoneColors: Record<string, string> = {
    hero: '#C8102E22',
    featured: '#1B5E2022',
    supporting: '#1565C022',
    accent: '#F9A82522',
    banner: '#6A1B9A22',
    callout: '#00838F22',
  }

  return (
    <div
      style={{
        width: 130,
        height: Math.min(th, 160),
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f8f8f8',
      }}
    >
      {layout?.backgroundLayers?.map(layer => {
        if (layer.type === 'solid') {
          return (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                left: layer.x * scale,
                top: layer.y * scale,
                width: layer.width * scale,
                height: layer.height * scale,
                backgroundColor: layer.color || '#eee',
                zIndex: layer.zIndex,
              }}
            />
          )
        }
        return null
      })}

      {layout?.zones?.map(zone => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: zone.x * scale,
            top: zone.y * scale,
            width: zone.width * scale,
            height: zone.height * scale,
            backgroundColor: zoneColors[zone.role] || '#eee',
            border: `1px solid ${(zoneColors[zone.role] || '#ddd').replace('22', '88')}`,
            zIndex: zone.zIndex,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: Math.max(5, 7 * scale),
              color: '#666',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {zone.role.substring(0, 3)}
          </span>
        </div>
      ))}
    </div>
  )
}

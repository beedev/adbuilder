'use client'
import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Grid } from 'lucide-react'
import { Template } from '@/types'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'hero-feature': { bg: '#ffebee', text: '#b71c1c' },
  editorial: { bg: '#e8f5e9', text: '#1b5e20' },
  promotional: { bg: '#fff3e0', text: '#e65100' },
  'full-bleed': { bg: '#e3f2fd', text: '#0d47a1' },
  split: { bg: '#f3e5f5', text: '#4a148c' },
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchTemplates = useCallback(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleDelete = async (template: Template) => {
    const confirmed = window.confirm(
      `Delete template "${template.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(template.id)
    await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchTemplates()
  }

  const zoneCount = (t: Template): number => {
    const layout = t.layoutJson as { zones?: unknown[] } | null
    return layout?.zones?.length ?? 0
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#C8102E',
          padding: '0 32px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 6,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: '#fff',
          }}
        >
          <ArrowLeft size={15} />
          Home
        </button>

        <Grid size={22} color="#fff" />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Templates</span>
        <div style={{ flex: 1 }} />

        <Link
          href="/templates/new"
          style={{
            padding: '8px 20px',
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: '#C8102E',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          <Plus size={16} />
          Create New Template
        </Link>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          All Templates
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>
          System templates are read-only. Create custom templates to suit your ad layouts.
        </p>

        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>
            Loading templates&hellip;
          </div>
        ) : templates.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              border: '2px dashed #ddd',
              borderRadius: 12,
              color: '#bbb',
            }}
          >
            <Grid size={48} color="#ddd" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>No templates yet</div>
            <Link
              href="/templates/new"
              style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '8px 20px',
                backgroundColor: '#C8102E',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create your first template
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {templates.map(template => {
              const catStyle = CATEGORY_COLORS[template.category] ?? {
                bg: '#f5f5f5',
                text: '#555',
              }
              const zones = zoneCount(template)

              return (
                <div
                  key={template.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Thumbnail / placeholder */}
                  <div
                    style={{
                      height: 120,
                      backgroundColor: catStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {template.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Grid size={40} color={catStyle.text} style={{ opacity: 0.4 }} />
                    )}
                    {template.isSystem && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 10,
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        System
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#111',
                            marginBottom: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {template.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 10,
                              backgroundColor: catStyle.bg,
                              color: catStyle.text,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {template.category}
                          </span>
                          <span style={{ fontSize: 11, color: '#aaa' }}>
                            {zones} zone{zones !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!template.isSystem ? (
                        <>
                          <button
                            onClick={() => router.push(`/templates/${template.id}/edit`)}
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              border: '1px solid #ddd',
                              borderRadius: 6,
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#333',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            disabled={deleting === template.id}
                            style={{
                              padding: '7px 12px',
                              border: '1px solid #ffcdd2',
                              borderRadius: 6,
                              backgroundColor: deleting === template.id ? '#eee' : '#fff5f5',
                              cursor: deleting === template.id ? 'default' : 'pointer',
                              color: '#c62828',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div
                          style={{
                            flex: 1,
                            padding: '7px 0',
                            fontSize: 12,
                            color: '#aaa',
                            textAlign: 'center',
                          }}
                        >
                          Read-only system template
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

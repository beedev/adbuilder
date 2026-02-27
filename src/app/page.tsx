'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ad } from '@/types'
import { format } from 'date-fns'
import { Plus, Store, Calendar, ChevronRight, Grid } from 'lucide-react'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F5F5F5', text: '#757575' },
  in_review: { bg: '#FFF3E0', text: '#E65100' },
  approved: { bg: '#E8F5E9', text: '#2E7D32' },
  published: { bg: '#E3F2FD', text: '#1565C0' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', validFrom: '', validTo: '' })

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => {
        setAds(data)
        setLoading(false)
      })
  }, [])

  const handleCreate = async () => {
    if (!form.name || !form.validFrom || !form.validTo) return
    setCreating(true)
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const ad = await res.json()
    setCreating(false)
    router.push(`/builder/${ad.id}`)
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
        <Store size={24} color="#fff" />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Weekly Ad Builder</span>
        <div style={{ flex: 1 }} />
        <Link
          href="/templates"
          style={{
            padding: '8px 20px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          <Grid size={16} />
          Manage Templates
        </Link>
        <button
          onClick={() => setShowCreate(true)}
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
          }}
        >
          <Plus size={16} />
          New Ad
        </button>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 24 }}>
          Your Ads
        </h1>

        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>Loading&hellip;</div>
        ) : ads.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              border: '2px dashed #ddd',
              borderRadius: 12,
              color: '#bbb',
            }}
          >
            <Store size={48} color="#ddd" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>No ads yet</div>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#C8102E',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Create your first ad
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {ads.map(ad => {
              const statusStyle = STATUS_COLORS[ad.status] || STATUS_COLORS.draft
              const pageCount =
                ad.sections?.reduce((acc, s) => acc + s.pages.length, 0) || 0
              return (
                <div
                  key={ad.id}
                  onClick={() => router.push(`/builder/${ad.id}`)}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 10,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.1s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#111',
                          marginBottom: 4,
                        }}
                      >
                        {ad.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#888',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Calendar size={12} />
                        {format(new Date(ad.validFrom), 'MMM d')} &ndash;{' '}
                        {format(new Date(ad.validTo), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                      }}
                    >
                      {ad.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <strong>{ad.sections?.length || 0}</strong> sections
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <strong>{pageCount}</strong> pages
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>v{ad.version}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {ad.regionIds?.map(r => (
                      <span
                        key={r}
                        style={{
                          fontSize: 10,
                          color: '#888',
                          backgroundColor: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#C8102E',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      Open <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Ad Modal */}
      {showCreate && (
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
            if (e.target === e.currentTarget) setShowCreate(false)
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 28,
              width: 380,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Create New Ad</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#555',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Ad Name
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Week of Mar 3-9, 2026"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#555',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#555',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Valid To
                  </label>
                  <input
                    type="date"
                    value={form.validTo}
                    onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: form.name ? '#C8102E' : '#eee',
                  color: form.name ? '#fff' : '#bbb',
                  cursor: form.name ? 'pointer' : 'default',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {creating ? 'Creating\u2026' : 'Create Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

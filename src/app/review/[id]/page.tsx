'use client'
import { useEffect, useState, use } from 'react'
import { Ad, Page, Comment, BlockData } from '@/types'
import { PageCanvas } from '@/components/canvas/PageCanvas'
import { usePriceStore } from '@/stores/priceStore'
import { Store, Check, X, MessageSquare, RotateCcw, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { format } from 'date-fns'

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ad, setAd] = useState<Ad | null>(null)
  const [blockData, setBlockData] = useState<BlockData[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'reject' | 'changes' | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportPdf() {
    if (isExporting) return
    setIsExporting(true)
    try {
      const res = await fetch(`/api/ads/${id}/export/pdf`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'PDF export failed. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-ad-${ad?.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() ?? id}.pdf`
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

  useEffect(() => {
    async function load() {
      const [adRes, blockRes, commentRes] = await Promise.all([
        fetch(`/api/ads/${id}`),
        fetch(`/api/ads/${id}/blockdata`),
        fetch(`/api/ads/${id}/comments`),
      ])
      const adData = await adRes.json()
      const blockArr = await blockRes.json()
      const commentArr = await commentRes.json()

      setAd(adData)
      setBlockData(blockArr)
      setComments(commentArr)
      usePriceStore.getState().importFeed(blockArr)

      const first = adData.sections?.[0]?.pages?.[0]
      if (first) setSelectedPageId(first.id)
    }
    load()
  }, [id])

  const allPages = ad?.sections?.flatMap(s => s.pages.sort((a, b) => a.position - b.position)) || []
  const currentPage = allPages.find(p => p.id === selectedPageId)
  const currentIdx = allPages.findIndex(p => p.id === selectedPageId)

  const pageComments = comments.filter(c => c.pageId === selectedPageId)

  const addComment = async () => {
    if (!newComment.trim() || !selectedPageId) return
    setSubmitting(true)
    const res = await fetch(`/api/ads/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment, pageId: selectedPageId })
    })
    const comment = await res.json()
    setComments(c => [...c, comment])
    setNewComment('')
    setSubmitting(false)
  }

  const handleDecision = async () => {
    if (!decision) return
    setSubmitting(true)

    if (decision === 'approve') {
      await fetch(`/api/ads/${id}/approve`, { method: 'POST' })
    } else if (decision === 'reject') {
      await fetch(`/api/ads/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: decisionNote })
      })
    } else {
      await fetch(`/api/ads/${id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: decisionNote, pageId: selectedPageId })
      })
    }

    const updated = await fetch(`/api/ads/${id}`).then(r => r.json())
    setAd(updated)
    setDecision(null)
    setDecisionNote('')
    setSubmitting(false)
  }

  if (!ad) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Loading review…
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: '#888', in_review: '#E65100', approved: '#2E7D32', published: '#1565C0'
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F0F2F5' }}>
      {/* Header */}
      <header style={{
        height: 52, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0
      }}>
        <Store size={20} color="#C8102E" />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#C8102E' }}>Ad Review</span>
        <div style={{ width: 1, height: 24, backgroundColor: '#e0e0e0' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{ad.name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: statusColors[ad.status], textTransform: 'uppercase' }}>
            {ad.status.replace('_', ' ')}
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          title="Download as PDF"
          style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: '#fff', color: isExporting ? '#bbb' : '#555', cursor: isExporting ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: isExporting ? 0.7 : 1 }}
        >
          <FileDown size={13} />
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </button>

        {ad.status === 'in_review' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setDecision('changes')}
              style={{ padding: '6px 14px', border: '1px solid #E65100', borderRadius: 6, backgroundColor: '#fff', color: '#E65100', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={13} /> Request Changes
            </button>
            <button
              onClick={() => setDecision('reject')}
              style={{ padding: '6px 14px', border: '1px solid #c62828', borderRadius: 6, backgroundColor: '#fff', color: '#c62828', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={13} /> Reject
            </button>
            <button
              onClick={() => setDecision('approve')}
              style={{ padding: '6px 14px', border: 'none', borderRadius: 6, backgroundColor: '#2E7D32', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={13} /> Approve
            </button>
          </div>
        )}
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Section navigator */}
        <div style={{ width: 180, backgroundColor: '#fff', borderRight: '1px solid #e0e0e0', overflowY: 'auto', flexShrink: 0, padding: 8 }}>
          {ad.sections.map(section => (
            <div key={section.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: section.themeColor || '#999' }} />
                {section.name}
              </div>
              {section.pages.sort((a, b) => a.position - b.position).map((page: Page) => {
                const hasComments = comments.some(c => c.pageId === page.id)
                return (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '5px 8px 5px 16px',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      backgroundColor: selectedPageId === page.id ? '#e3f2fd' : 'transparent',
                      color: selectedPageId === page.id ? '#1565C0' : '#555',
                      fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                      fontWeight: selectedPageId === page.id ? 600 : 400,
                    }}
                  >
                    Page {page.position + 1}
                    {hasComments && <MessageSquare size={10} color="#E65100" style={{ marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Canvas (read-only) */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => currentIdx > 0 && setSelectedPageId(allPages[currentIdx - 1].id)}
              disabled={currentIdx <= 0}
              style={{ border: 'none', background: 'none', cursor: currentIdx > 0 ? 'pointer' : 'default', opacity: currentIdx > 0 ? 1 : 0.3, padding: 4 }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 13, color: '#666' }}>Page {currentIdx + 1} of {allPages.length}</span>
            <button
              onClick={() => currentIdx < allPages.length - 1 && setSelectedPageId(allPages[currentIdx + 1].id)}
              disabled={currentIdx >= allPages.length - 1}
              style={{ border: 'none', background: 'none', cursor: currentIdx < allPages.length - 1 ? 'pointer' : 'default', opacity: currentIdx < allPages.length - 1 ? 1 : 0.3, padding: 4 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {currentPage && (
            <div style={{ display: 'inline-block', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden', backgroundColor: '#fff', pointerEvents: 'none' }}>
              <PageCanvas
                page={{
                  ...currentPage,
                  placedBlocks: currentPage.placedBlocks.map(pb => ({
                    ...pb,
                    blockData: blockData.find(bd => bd.id === pb.blockDataId) || pb.blockData
                  }))
                }}
                allBlockData={blockData}
                mode="readonly"
              />
            </div>
          )}
        </div>

        {/* Comments panel */}
        <div style={{ width: 260, backgroundColor: '#fff', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={14} color="#888" />
            Comments ({pageComments.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {pageComments.length === 0 ? (
              <div style={{ color: '#bbb', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                No comments on this page
              </div>
            ) : (
              pageComments.map(comment => (
                <div key={comment.id} style={{ marginBottom: 12, padding: 10, backgroundColor: '#fffde7', borderRadius: 6, border: '1px solid #fff9c4' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>
                    {comment.author?.name || 'Reviewer'}
                  </div>
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4 }}>{comment.text}</div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>

          {ad.status === 'in_review' && (
            <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, resize: 'none', boxSizing: 'border-box', marginBottom: 6 }}
              />
              <button
                onClick={addComment}
                disabled={submitting || !newComment.trim()}
                style={{ width: '100%', padding: '7px', backgroundColor: !newComment.trim() ? '#f5f5f5' : '#1565C0', border: 'none', borderRadius: 4, color: !newComment.trim() ? '#bbb' : '#fff', cursor: newComment.trim() ? 'pointer' : 'default', fontSize: 12, fontWeight: 600 }}
              >
                Post Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision modal */}
      {decision && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              {decision === 'approve' ? 'Approve Ad' : decision === 'reject' ? 'Reject Ad' : 'Request Changes'}
            </h2>
            {decision !== 'approve' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                  {decision === 'reject' ? 'Reason for rejection' : 'Notes for designer'}
                </label>
                <textarea
                  value={decisionNote}
                  onChange={e => setDecisionNote(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder={decision === 'reject' ? 'Why is this ad being rejected?' : 'What needs to be changed?'}
                />
              </div>
            )}
            {decision === 'approve' && (
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>This will mark the ad as approved and ready to publish.</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDecision(null)} style={{ flex: 1, padding: '9px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button
                onClick={handleDecision}
                disabled={submitting}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff',
                  backgroundColor: decision === 'approve' ? '#2E7D32' : '#c62828',
                }}
              >
                {submitting ? 'Processing…' : decision === 'approve' ? 'Confirm Approve' : decision === 'reject' ? 'Confirm Reject' : 'Send to Designer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

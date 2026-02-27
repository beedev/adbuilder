'use client'
import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { BlockData } from '@/types'
import { usePriceStore } from '@/stores/priceStore'
import { formatPrice } from '@/lib/priceFormatter'
import { Search, Package, Plus, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { BlockCreatorModal } from '@/components/modals/BlockCreatorModal'

interface ComponentDef {
  id: string
  label: string
  color: string
  priceText: string
  headline: string
  overlayMode?: 'stamp_overlay'
  stampType?: string
}

const STAMP_OVERLAY_COMPONENTS: ComponentDef[] = [
  { id: 'stamp-sale',    label: 'SALE',           color: '#C8102E', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'SALE' },
  { id: 'stamp-bogo',    label: 'BOGO',            color: '#1B5E20', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'BOGO' },
  { id: 'stamp-hot',     label: 'HOT DEAL',        color: '#E65100', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'HOT_DEAL' },
  { id: 'stamp-pct',     label: '% OFF',           color: '#C8102E', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'PCT_OFF' },
  { id: 'stamp-mgr',     label: "MGR'S SPECIAL",   color: '#6A1B9A', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'MANAGERS_SPECIAL' },
  { id: 'stamp-digital', label: 'DIGITAL COUPON',  color: '#006064', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'DIGITAL_COUPON' },
  { id: 'stamp-limited', label: 'LIMITED TIME',    color: '#BF360C', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'LIMITED' },
  { id: 'stamp-new',     label: 'NEW',             color: '#1565C0', priceText: '', headline: '', overlayMode: 'stamp_overlay', stampType: 'NEW' },
]

const SALE_BAND_COMPONENTS: ComponentDef[] = [
  { id: 'sale-band-red',   label: 'Red Sale Band',   color: '#C8102E', priceText: '$X.XX', headline: 'Special Offer!' },
  { id: 'sale-band-blue',  label: 'Blue Sale Band',  color: '#1565C0', priceText: '$X.XX', headline: 'Members Save' },
  { id: 'sale-band-green', label: 'Green Sale Band', color: '#2E7D32', priceText: '$X.XX', headline: 'Fresh Savings' },
  { id: 'sale-band-dark',  label: 'Dark Sale Band',  color: '#212121', priceText: '$X.XX', headline: 'Limited Time' },
]

// ── Section header with collapse toggle ─────────────────────────────────────
function SectionHeader({
  label,
  count,
  open,
  onToggle,
  action,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 4px',
        cursor: 'pointer',
        borderRadius: 4,
        userSelect: 'none',
      }}
    >
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}
      >
        {open
          ? <ChevronDown size={13} color="#888" />
          : <ChevronRight size={13} color="#888" />
        }
        <span style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>({count})</span>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Sale band draggable ──────────────────────────────────────────────────────
function ComponentCard({ def }: { def: ComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component:${def.id}`,
    data: { type: 'component', def },
  })

  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid #e0e0e0',
        marginBottom: 5,
        boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          cursor: 'grab',
          opacity: isDragging ? 0.4 : 1,
          touchAction: 'none',
          userSelect: 'none',
          backgroundColor: def.color,
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <GripVertical size={12} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: def.color, lineHeight: 1 }}>{def.priceText}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{def.label}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>{def.headline}</div>
        </div>
      </div>
    </div>
  )
}

// ── Stamp overlay draggable ──────────────────────────────────────────────────
function StampOverlayCard({ def }: { def: ComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component:${def.id}`,
    data: { type: 'component', def },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 7px',
        border: '1px solid #e8e8e8',
        borderRadius: 6,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          width: 26, height: 26, borderRadius: '50%',
          backgroundColor: def.color,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          border: '1.5px solid rgba(255,255,255,0.5)',
        }}
      >
        <span style={{ fontSize: 6, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.1, letterSpacing: '0.02em' }}>
          {def.label.split(' ')[0]}
        </span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.label}</span>
      <GripVertical size={11} color="#ccc" style={{ flexShrink: 0 }} />
    </div>
  )
}

// ── Product block draggable card ─────────────────────────────────────────────
function TrayBlockCard({ blockData, isPlaced }: { blockData: BlockData; isPlaced: boolean }) {
  const feed = blockData.feedJson
  const price = usePriceStore(s => s.getPrice(feed.upc)) ?? feed.price

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray:${blockData.id}`,
    data: { type: 'tray', blockData },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : isPlaced ? 0.55 : 1,
        touchAction: 'none',
        userSelect: 'none',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        backgroundColor: isPlaced ? '#f9f9f9' : '#fff',
        padding: '7px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 5,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 5,
          overflow: 'hidden', backgroundColor: '#f5f5f5',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {feed.images?.product?.url ? (
          <img
            src={feed.images.product.url}
            alt={feed.productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        ) : (
          <Package size={18} color="#bbb" />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feed.productName}
        </div>
        <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{feed.category}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#C8102E', marginTop: 1 }}>
          {price ? formatPrice(price) : '—'}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        {feed.stamps?.slice(0, 2).map(stamp => (
          <span
            key={stamp}
            style={{
              fontSize: 8, fontWeight: 700,
              backgroundColor: '#C8102E', color: '#fff',
              padding: '1px 4px', borderRadius: 3, textTransform: 'uppercase',
            }}
          >
            {stamp}
          </span>
        ))}
        {isPlaced && (
          <span style={{ fontSize: 8, color: '#888', backgroundColor: '#eee', padding: '1px 4px', borderRadius: 3 }}>
            placed
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main BlockTray ───────────────────────────────────────────────────────────
interface Props {
  blockData: BlockData[]
  placedBlockDataIds: Set<string>
  adId: string
  onBlockCreated: (newBlock: BlockData) => void
}

export function BlockTray({ blockData, placedBlockDataIds, adId, onBlockCreated }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showCreator, setShowCreator] = useState(false)

  // Section collapse state
  const [stampOpen, setStampOpen] = useState(true)
  const [compOpen, setCompOpen]   = useState(true)
  const [blocksOpen, setBlocksOpen] = useState(true)

  // Only show genuine product/overlay blocks — exclude stamp overlay and sale band
  // placeholders that were created by the component drag (category === 'Overlays' or 'Components')
  const productBlocks = blockData.filter(b => {
    const bt = (b.feedJson as Record<string, unknown>).blockType as string | undefined
    return bt !== 'overlay' && bt !== 'promotional'
  })

  const categories = ['All', ...Array.from(new Set(productBlocks.map(b => b.feedJson.category)))]

  const filtered = productBlocks.filter(b => {
    const feed = b.feedJson
    const matchSearch =
      !search ||
      feed.productName.toLowerCase().includes(search.toLowerCase()) ||
      feed.upc.includes(search)
    const matchCat = categoryFilter === 'All' || feed.category === categoryFilter
    return matchSearch && matchCat
  })

  const placed   = filtered.filter(b =>  placedBlockDataIds.has(b.id))
  const unplaced = filtered.filter(b => !placedBlockDataIds.has(b.id))

  const addBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', fontSize: 10, fontWeight: 700,
    border: '1px solid #C8102E', borderRadius: 4,
    backgroundColor: '#fff', color: '#C8102E',
    cursor: 'pointer', flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Stamp Overlays ─────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #f0f0f0', padding: '6px 8px' }}>
        <SectionHeader
          label="Stamp Overlays"
          count={STAMP_OVERLAY_COMPONENTS.length}
          open={stampOpen}
          onToggle={() => setStampOpen(p => !p)}
        />
        {stampOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
            {STAMP_OVERLAY_COMPONENTS.map(def => (
              <StampOverlayCard key={def.id} def={def} />
            ))}
          </div>
        )}
        {stampOpen && (
          <div style={{ fontSize: 9, color: '#bbb', marginTop: 5, textAlign: 'center' }}>
            Drag onto canvas to place
          </div>
        )}
      </div>

      {/* ── Sale Band Components ────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #f0f0f0', padding: '6px 8px' }}>
        <SectionHeader
          label="Components"
          count={SALE_BAND_COMPONENTS.length}
          open={compOpen}
          onToggle={() => setCompOpen(p => !p)}
        />
        {compOpen && (
          <div style={{ marginTop: 6 }}>
            {SALE_BAND_COMPONENTS.map(def => (
              <ComponentCard key={def.id} def={def} />
            ))}
          </div>
        )}
        {compOpen && (
          <div style={{ fontSize: 9, color: '#bbb', marginTop: 2, textAlign: 'center' }}>
            Drag onto canvas · edit text in Inspector after placing
          </div>
        )}
      </div>

      {/* ── Product Blocks ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '6px 8px' }}>
        <SectionHeader
          label="Blocks"
          count={productBlocks.length}
          open={blocksOpen}
          onToggle={() => setBlocksOpen(p => !p)}
          action={
            <button onClick={() => setShowCreator(true)} style={addBtnStyle}>
              <Plus size={10} />
              Add
            </button>
          }
        />

        {blocksOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, marginTop: 6, gap: 6 }}>
            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search
                size={13}
                style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{
                  width: '100%', paddingLeft: 26, paddingRight: 8,
                  paddingTop: 5, paddingBottom: 5,
                  border: '1px solid #ddd', borderRadius: 6,
                  fontSize: 12, outline: 'none', boxSizing: 'border-box',
                  color: '#111',
                }}
              />
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', flexShrink: 0 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 10,
                    border: '1px solid',
                    borderColor: categoryFilter === cat ? '#C8102E' : '#ddd',
                    backgroundColor: categoryFilter === cat ? '#C8102E' : '#fff',
                    color: categoryFilter === cat ? '#fff' : '#555',
                    cursor: 'pointer',
                    fontWeight: categoryFilter === cat ? 700 : 400,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Count */}
            <div style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>
              {unplaced.length} available &middot; {placed.length} placed
            </div>

            {/* Block list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {unplaced.length === 0 && placed.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 32 }}>
                  No blocks found
                </div>
              )}
              {unplaced.map(bd => (
                <TrayBlockCard key={bd.id} blockData={bd} isPlaced={false} />
              ))}
              {placed.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: '#bbb', margin: '8px 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Already placed
                  </div>
                  {placed.map(bd => (
                    <TrayBlockCard key={bd.id} blockData={bd} isPlaced={true} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Block Creator Modal */}
      {showCreator && (
        <BlockCreatorModal
          adId={adId}
          onCreated={onBlockCreated}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  )
}

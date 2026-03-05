'use client'
import React, { useState } from 'react'
import { Vehicle, Page, PlacedBlock } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { ChevronDown, ChevronRight, FileText, Layers, Box, Trash2 } from 'lucide-react'

// ── BlockItem ─────────────────────────────────────────────────────────────────

interface BlockItemProps {
  block: PlacedBlock
  isSelected: boolean
  onSelect: () => void
}

function BlockItem({ block, isSelected, onSelect }: BlockItemProps) {
  const [hovered, setHovered] = useState(false)
  const { removeBlock } = useAdStore()
  const { selectBlock } = useUIStore()

  const productName =
    (block.blockData?.feedJson?.productName as string) ||
    `Block ${block.id.slice(-4)}`

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeBlock(block.id)
    // Deselect if this was the selected block
    if (isSelected) selectBlock(null)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1,
          textAlign: 'left',
          padding: '4px 8px 4px 44px',
          borderRadius: 4,
          border: 'none',
          backgroundColor: isSelected ? '#fff3e0' : 'transparent',
          color: isSelected ? '#E65100' : '#666',
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontWeight: isSelected ? 600 : 400,
          overflow: 'hidden',
          paddingRight: hovered ? 28 : 8,
        }}
      >
        <Box size={10} style={{ flexShrink: 0 }} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {productName}
        </span>
      </button>

      {hovered && (
        <button
          onClick={handleDelete}
          title="Remove block"
          style={{
            position: 'absolute',
            right: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 3,
            color: '#bbb',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 3,
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = '#c62828'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = '#bbb'
          }}
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  )
}

// ── PageItem ──────────────────────────────────────────────────────────────────

interface PageItemProps {
  page: Page
  isSelected: boolean
  canDelete: boolean
  onSelect: () => void
  onDelete: () => void
  selectedBlockId: string | null
}

function PageItem({
  page,
  isSelected,
  canDelete,
  onSelect,
  onDelete,
  selectedBlockId,
}: PageItemProps) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [blocksExpanded, setBlocksExpanded] = useState(false)
  const { selectBlock } = useUIStore()

  const sortedBlocks = [...page.placedBlocks].sort((a, b) => a.zIndex - b.zIndex)

  if (confirming) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 8px 5px 28px',
          backgroundColor: '#fff5f5',
        }}
      >
        <span style={{ fontSize: 11, color: '#c62828', flex: 1 }}>Delete page?</span>
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete()
            setConfirming(false)
          }}
          style={{
            fontSize: 10,
            padding: '2px 7px',
            backgroundColor: '#c62828',
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Delete
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            setConfirming(false)
          }}
          style={{
            fontSize: 10,
            padding: '2px 7px',
            backgroundColor: '#eee',
            color: '#555',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        {/* Expand/collapse blocks toggle */}
        <button
          onClick={() => setBlocksExpanded(e => !e)}
          style={{
            position: 'absolute',
            left: 28,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: '#bbb',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {sortedBlocks.length > 0 ? (
            blocksExpanded ? (
              <ChevronDown size={10} />
            ) : (
              <ChevronRight size={10} />
            )
          ) : (
            <span style={{ width: 10 }} />
          )}
        </button>

        <button
          onClick={onSelect}
          style={{
            flex: 1,
            textAlign: 'left',
            padding: '6px 8px 6px 40px',
            borderRadius: 4,
            border: 'none',
            backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
            color: isSelected ? '#1565C0' : '#555',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: isSelected ? 600 : 400,
            paddingRight: hovered && canDelete ? 28 : 8,
          }}
        >
          <FileText size={12} />
          <span>Page {page.position + 1}</span>
          {sortedBlocks.length > 0 && (
            <span style={{ fontSize: 10, color: '#aaa', marginLeft: 'auto' }}>
              {sortedBlocks.length}b
            </span>
          )}
        </button>

        {hovered && canDelete && (
          <button
            onClick={e => {
              e.stopPropagation()
              setConfirming(true)
            }}
            title="Delete page"
            style={{
              position: 'absolute',
              right: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 3,
              color: '#bbb',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 3,
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#c62828'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#bbb'
            }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Blocks sub-list */}
      {blocksExpanded && sortedBlocks.length > 0 && (
        <div>
          {sortedBlocks.map(block => (
            <BlockItem
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => selectBlock(block.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── VehicleItem ───────────────────────────────────────────────────────────────

interface VehicleItemProps {
  vehicle: Vehicle
  selectedPageId: string | null
  selectedBlockId: string | null
  totalPages: number
  onSelectPage: (pageId: string) => void
  onDeletePage: (pageId: string, vehicleId: string) => void
}

function VehicleItem({
  vehicle,
  selectedPageId,
  selectedBlockId,
  totalPages,
  onSelectPage,
  onDeletePage,
}: VehicleItemProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#222',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: vehicle.themeColor || '#999',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vehicle.name}
        </span>
        <span style={{ fontSize: 10, color: '#aaa' }}>{vehicle.pages.length}p</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {expanded && (
        <div>
          {vehicle.pages
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(page => (
              <PageItem
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                canDelete={totalPages > 1}
                selectedBlockId={selectedBlockId}
                onSelect={() => onSelectPage(page.id)}
                onDelete={() => onDeletePage(page.id, vehicle.id)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// ── VehicleNavigator ──────────────────────────────────────────────────────────

interface Props {
  vehicles: Vehicle[]
  selectedPageId: string | null
  onSelectPage: (pageId: string) => void
}

export function VehicleNavigator({ vehicles, selectedPageId, onSelectPage }: Props) {
  const { deletePage } = useAdStore()
  const { selectPage, selectedBlockId } = useUIStore()

  const handleDeletePage = async (pageId: string, vehicleId: string) => {
    // If deleting the currently selected page, navigate to another page first
    if (selectedPageId === pageId) {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      const sortedPages =
        vehicle?.pages.slice().sort((a, b) => a.position - b.position) ?? []
      const idx = sortedPages.findIndex(p => p.id === pageId)

      const fallback =
        sortedPages[idx - 1] ??
        sortedPages[idx + 1] ??
        vehicles.flatMap(v => v.pages).find(p => p.id !== pageId)

      if (fallback) selectPage(fallback.id)
    }
    await deletePage(pageId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 8px',
            marginBottom: 8,
          }}
        >
          <Layers size={14} color="#888" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Vehicles
          </span>
        </div>
      </div>

      {/* Vehicle list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(() => {
          const totalPages = vehicles.reduce((sum, v) => sum + v.pages.length, 0)
          return vehicles.map(vehicle => (
            <VehicleItem
              key={vehicle.id}
              vehicle={vehicle}
              selectedPageId={selectedPageId}
              selectedBlockId={selectedBlockId}
              totalPages={totalPages}
              onSelectPage={onSelectPage}
              onDeletePage={handleDeletePage}
            />
          ))
        })()}
      </div>
    </div>
  )
}

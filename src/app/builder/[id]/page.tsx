'use client'
import React, { useEffect, useState, useCallback, use } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useAdStore } from '@/stores/adStore'
import { useUIStore } from '@/stores/uiStore'
import { usePriceStore } from '@/stores/priceStore'
import { PageCanvas } from '@/components/canvas/PageCanvas'
import { BlockTray } from '@/components/panels/BlockTray'
import { SectionNavigator } from '@/components/panels/SectionNavigator'
import { BlockInspector } from '@/components/panels/BlockInspector'
import { TopBar } from '@/components/layout/TopBar'
import { TemplateSelector } from '@/components/templates/TemplateSelector'
import { BlockData, BlockData as BD, Page, StampType, TemplateLayout, TemplateZone } from '@/types'
import { ChevronLeft, ChevronRight, LayoutTemplate, ZoomIn, ZoomOut } from 'lucide-react'

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [blockData, setBlockData] = useState<BlockData[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [dragOverlay, setDragOverlay] = useState<{ blockData: BD; w: number; h: number; isStamp?: boolean; stampColor?: string } | null>(null)

  const { ad, setAd, setTemplates, markSaved, isDirty, placeBlock, moveBlock, markDirty } = useAdStore()
  const {
    selectedBlockId,
    selectedPageId,
    selectPage,
    showTemplateSelector,
    templateSelectorPageId,
    showPreview,
    togglePreview,
    zoom,
    setZoom,
    activePanel,
  } = useUIStore()

  // Load ad
  useEffect(() => {
    async function load() {
      const [adRes, templateRes, blockRes] = await Promise.all([
        fetch(`/api/ads/${id}`),
        fetch('/api/templates'),
        fetch(`/api/ads/${id}/blockdata`),
      ])
      const adData = await adRes.json()
      const templateData = await templateRes.json()
      const blockDataArr = await blockRes.json()

      setAd(adData)
      setTemplates(templateData)
      setBlockData(blockDataArr)
      usePriceStore.getState().importFeed(blockDataArr)

      // Auto-select first page
      const firstPage = adData.sections?.[0]?.pages?.[0]
      if (firstPage) selectPage(firstPage.id)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Autosave every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) handleSave()
    }, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useAdStore.getState().undo()
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        useAdStore.getState().redo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = useCallback(async () => {
    if (!ad || isSaving) return
    setIsSaving(true)
    try {
      for (const section of ad.sections) {
        for (const page of section.pages) {
          for (const pb of page.placedBlocks) {
            await fetch(`/api/ads/${id}/blocks/${pb.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                x: pb.x,
                y: pb.y,
                width: pb.width,
                height: pb.height,
                overrides: pb.overrides,
              }),
            }).catch(() => {})
          }
        }
      }
      markSaved()
    } finally {
      setIsSaving(false)
    }
  }, [ad, id, isSaving, markSaved])

  const handleSubmit = useCallback(async () => {
    if (!ad) return
    await fetch(`/api/ads/${ad.id}/submit`, { method: 'POST' })
    const updated = await fetch(`/api/ads/${ad.id}`).then(r => r.json())
    setAd(updated)
  }, [ad, setAd])

  // ── DnD setup (all hooks must be before any early return) ──────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const collisionDetection = useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const within = pointerWithin(args)
      if (within.length > 0) return within
      return closestCenter(args)
    },
    []
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { data } = event.active
    // Read fresh store state — currentPage not in scope yet (before guard)
    const adInner = useAdStore.getState().ad
    if (!adInner) return
    const pages = adInner.sections.flatMap(s => s.pages)
    const uiState = useUIStore.getState()
    const page = uiState.selectedPageId
      ? pages.find(p => p.id === uiState.selectedPageId)
      : pages[0]
    const pageLayout = page?.template?.layoutJson as TemplateLayout | undefined
    const pageZones: TemplateZone[] = pageLayout?.zones || []

    if (data.current?.type === 'tray') {
      const bd = data.current.blockData as BD
      const zone = pageZones[0]
      setDragOverlay({ blockData: bd, w: zone?.width || 200, h: zone?.height || 280 })
    }
    if (data.current?.type === 'component') {
      const def = data.current.def as { label: string; color: string; overlayMode?: string }
      const isStamp = def.overlayMode === 'stamp_overlay'
      setDragOverlay({
        blockData: {
          id: 'preview',
          blockId: 'preview',
          upc: '',
          feedJson: { blockId: 'preview', upc: '', productName: def.label, brand: '', category: 'Components', price: null, images: {}, stamps: [], headline: def.label, locale: 'en-US', validFrom: '', validTo: '' },
          regionId: null,
          adId: '',
          importedAt: '',
        } as unknown as BD,
        w: isStamp ? 130 : 760,
        h: isStamp ? 130 : 80,
        isStamp,
        stampColor: def.color,
      })
    }
    if (data.current?.type === 'placed') {
      const pb = data.current.placedBlock
      setDragOverlay({
        blockData: pb.blockData || {
          feedJson: { productName: 'Block', upc: '', price: null, images: {}, stamps: [], headline: '', category: '' },
        } as any,
        w: pb.width,
        h: pb.height,
      })
    }
    useUIStore.getState().setDragging(true)
  }, [])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // no-op — zone highlights removed
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event
    setDragOverlay(null)
    useUIStore.getState().setDragging(false)

    // Read fresh store state
    const adInner = useAdStore.getState().ad
    if (!adInner) return
    const pages = adInner.sections.flatMap(s => s.pages)
    const uiState = useUIStore.getState()
    const page = uiState.selectedPageId
      ? pages.find(p => p.id === uiState.selectedPageId)
      : pages[0]
    if (!page) return
    const scale = uiState.zoom

    const activeData = active.data.current

    // Repositioning a placed block: always apply pointer delta, ignore zone snapping
    if (activeData?.type === 'placed') {
      const pb = activeData.placedBlock
      const newX = Math.max(0, pb.x + delta.x / scale)
      const newY = Math.max(0, pb.y + delta.y / scale)
      moveBlock(pb.id, page.id, newX, newY)
      markDirty()
      return
    }

    // Placing from tray: auto-fill next empty zone
    if (activeData?.type === 'tray') {
      const bd = activeData.blockData as BD
      const overData = over?.data.current
      const pageLayout = page.template?.layoutJson as TemplateLayout | undefined
      const pageZones: TemplateZone[] = pageLayout?.zones || []

      // Try the zone user dropped on, then fall back to next empty zone
      let targetZone = overData?.type === 'zone'
        ? pageZones.find(z => z.id === overData.zoneId)
        : null
      if (!targetZone) {
        targetZone = pageZones.find(z => !page.placedBlocks.some(b => b.zoneId === z.id)) ?? null
      }

      const zoneId = targetZone?.id ?? null
      const x = targetZone?.x ?? 50
      const y = targetZone?.y ?? 50
      const w = targetZone?.width ?? 200
      const h = targetZone?.height ?? 280

      const clientId = placeBlock(page.id, bd.id, zoneId, x, y, w, h)
      markDirty()
      fetch(`/api/ads/${id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id, blockDataId: bd.id, zoneId, x, y, width: w, height: h, zIndex: 1, overrides: {} }),
      })
        .then(r => r.json())
        .then((placed: { id: string }) => {
          useAdStore.getState().replacePlacedBlockId(clientId, placed.id)
        })
        .catch(console.error)
    }

    // Placing a pre-built component (sale band, stamp overlay, etc.)
    if (activeData?.type === 'component') {
      const def = activeData.def as { id: string; label: string; color: string; priceText: string; headline: string; overlayMode?: string; stampType?: string }

      // ── Stamp overlay: small standalone badge ──────────────────────────
      if (def.overlayMode === 'stamp_overlay') {
        const pageLayout = page.template?.layoutJson as TemplateLayout | undefined
        const canvasW = pageLayout?.canvas?.width || 800
        const canvasH = pageLayout?.canvas?.height || 1100
        const w = 130
        const h = 130

        // Calculate drop position from pointer location relative to canvas element
        let x = Math.round(canvasW / 2 - w / 2)
        let y = Math.round(canvasH / 2 - h / 2)
        const droppedRect = active.rect.current.translated
        const canvasEl = document.querySelector(`[data-canvas="${page.id}"]`)
        if (droppedRect && canvasEl) {
          const canvasRect = canvasEl.getBoundingClientRect()
          const rawX = (droppedRect.left - canvasRect.left) / scale
          const rawY = (droppedRect.top - canvasRect.top) / scale
          x = Math.max(0, Math.min(canvasW - w, Math.round(rawX)))
          y = Math.max(0, Math.min(canvasH - h, Math.round(rawY)))
        }

        fetch(`/api/ads/${id}/blocks/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upc: '', blockType: 'overlay', productName: def.label, category: 'Overlays', price: null, priceText: '', headline: def.label }),
        })
          .then(r => r.json())
          .then((newBlock: BD) => {
            setBlockData(prev => [...prev, newBlock])
            // Pass newBlock as blockData so BlockRenderer never sees undefined
            const clientId = placeBlock(page.id, newBlock.id, null, x, y, w, h, newBlock)
            useAdStore.getState().updateBlockOverride(clientId, { displayMode: 'stamp_overlay', stamps: [def.stampType as StampType] })
            markDirty()
            fetch(`/api/ads/${id}/blocks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pageId: page.id, blockDataId: newBlock.id, zoneId: null, x, y, width: w, height: h, zIndex: 50, overrides: { displayMode: 'stamp_overlay', stamps: [def.stampType] } }),
            })
              .then(r => r.json())
              .then((placed: { id: string }) => { useAdStore.getState().replacePlacedBlockId(clientId, placed.id) })
              .catch(console.error)
          })
          .catch(console.error)
        return
      }
      const pageLayout = page.template?.layoutJson as TemplateLayout | undefined
      const pageZones: TemplateZone[] = pageLayout?.zones || []
      const overData = over?.data.current
      let targetZone = overData?.type === 'zone'
        ? pageZones.find(z => z.id === overData.zoneId)
        : null
      if (!targetZone) {
        targetZone = pageZones.find(z => !page.placedBlocks.some(b => b.zoneId === z.id)) ?? null
      }
      const zoneId = targetZone?.id ?? null
      const x = targetZone?.x ?? 20
      const y = targetZone?.y ?? 20
      const w = targetZone?.width ?? 760
      const h = targetZone?.height ?? 80

      // Create the block data via API then place it
      fetch(`/api/ads/${id}/blocks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upc: '',
          blockType: 'promotional',
          productName: def.label,
          category: 'Components',
          price: null,
          priceText: def.priceText,
          headline: def.headline,
        }),
      })
        .then(r => r.json())
        .then((newBlock: BD) => {
          // Add to local block data state
          setBlockData(prev => [...prev, newBlock])
          // Place it on canvas with correct overrides
          const clientId = placeBlock(page.id, newBlock.id, zoneId, x, y, w, h)
          useAdStore.getState().updateBlockOverride(clientId, { displayMode: 'sale_band', backgroundColor: def.color })
          markDirty()
          // Persist the placement with overrides
          fetch(`/api/ads/${id}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId: page.id, blockDataId: newBlock.id, zoneId, x, y, width: w, height: h, zIndex: 1, overrides: { displayMode: 'sale_band', backgroundColor: def.color } }),
          })
            .then(r => r.json())
            .then((placed: { id: string }) => {
              useAdStore.getState().replacePlacedBlockId(clientId, placed.id)
            })
            .catch(console.error)
        })
        .catch(console.error)
    }
  }, [id, placeBlock, moveBlock, markDirty])
  // ── end DnD setup ──────────────────────────────────────────────────────

  if (!ad) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
        }}
      >
        Loading ad&hellip;
      </div>
    )
  }

  // Derived values (post-guard, no hooks below this line)
  const effectiveScale = zoom

  const allPages = ad.sections.flatMap(s =>
    s.pages.slice().sort((a, b) => a.position - b.position)
  )
  const currentPage: Page | undefined = selectedPageId
    ? allPages.find(p => p.id === selectedPageId)
    : allPages[0]

  const placedIds = new Set(allPages.flatMap(p => p.placedBlocks.map(b => b.blockDataId)))

  const selectedBlock = selectedBlockId
    ? allPages.flatMap(p => p.placedBlocks).find(b => b.id === selectedBlockId)
    : null

  const selectedBlockEnriched = selectedBlock
    ? {
        ...selectedBlock,
        blockData:
          blockData.find(bd => bd.id === selectedBlock.blockDataId) ||
          selectedBlock.blockData,
      }
    : null

  const currentPageIdx = currentPage ? allPages.findIndex(p => p.id === currentPage.id) : 0

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F0F2F5',
        overflow: 'hidden',
      }}
    >
      <TopBar ad={ad} onSave={handleSave} onSubmit={handleSubmit} isSaving={isSaving} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={collisionDetection}
      >
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Section Navigator */}
          <div
            style={{
              width: 200,
              backgroundColor: '#fff',
              borderRight: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <SectionNavigator
              sections={ad.sections}
              selectedPageId={selectedPageId}
              onSelectPage={selectPage}
            />
          </div>

          {/* CENTER: Canvas area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Canvas toolbar */}
            <div
              style={{
                height: 40,
                backgroundColor: '#fff',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {currentPage?.template && (
                <span style={{ fontSize: 12, color: '#888' }}>{currentPage.template.name}</span>
              )}

              <button
                onClick={() =>
                  currentPage && useUIStore.getState().openTemplateSelector(currentPage.id)
                }
                style={{
                  padding: '4px 10px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#555',
                }}
              >
                <LayoutTemplate size={13} />
                Change Template
              </button>

              <div style={{ flex: 1 }} />

              {/* Zoom controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setZoom(zoom - 0.1)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <ZoomOut size={14} color="#666" />
                </button>
                <span
                  style={{ fontSize: 11, color: '#555', minWidth: 36, textAlign: 'center' }}
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(zoom + 0.1)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <ZoomIn size={14} color="#666" />
                </button>
              </div>

              {/* Page nav */}
              {allPages.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderLeft: '1px solid #eee',
                    paddingLeft: 8,
                  }}
                >
                  <button
                    onClick={() => {
                      if (currentPageIdx > 0) selectPage(allPages[currentPageIdx - 1].id)
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 11, color: '#555' }}>
                    {currentPageIdx + 1} / {allPages.length}
                  </span>
                  <button
                    onClick={() => {
                      if (currentPageIdx < allPages.length - 1)
                        selectPage(allPages[currentPageIdx + 1].id)
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Canvas scroll area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
                padding: 24,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              {currentPage ? (
                <div
                  style={{
                    flexShrink: 0,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                  }}
                >
                  <PageCanvas
                    page={{
                      ...currentPage,
                      placedBlocks: currentPage.placedBlocks.map(pb => ({
                        ...pb,
                        blockData:
                          blockData.find(bd => bd.id === pb.blockDataId) || pb.blockData,
                      })),
                    }}
                    allBlockData={blockData}
                    mode="edit"
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#bbb', marginTop: 80 }}>
                  Select a page from the left panel to start editing
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Block Tray / Inspector */}
          <div
            style={{
              width: 240,
              backgroundColor: '#fff',
              borderLeft: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Panel tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
              {(['tray', 'inspector'] as const).map(panel => (
                <button
                  key={panel}
                  onClick={() => useUIStore.getState().setActivePanel(panel)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderBottom:
                      activePanel === panel ? '2px solid #C8102E' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: activePanel === panel ? 700 : 400,
                    color: activePanel === panel ? '#C8102E' : '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {panel === 'tray' ? 'Blocks' : 'Inspector'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {activePanel === 'tray' ? (
                <BlockTray
                  blockData={blockData}
                  placedBlockDataIds={placedIds}
                  adId={id}
                  onBlockCreated={(newBlock) => {
                    setBlockData(prev => [...prev, newBlock])
                    usePriceStore.getState().importFeed([...blockData, newBlock])
                  }}
                />
              ) : selectedBlockEnriched ? (
                <BlockInspector placedBlock={selectedBlockEnriched} />
              ) : (
                <div
                  style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 40 }}
                >
                  Select a block to inspect
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {dragOverlay && (
            dragOverlay.isStamp ? (
              <div
                style={{
                  width: dragOverlay.w * effectiveScale,
                  height: dragOverlay.h * effectiveScale,
                  borderRadius: '50%',
                  backgroundColor: dragOverlay.stampColor || '#C8102E',
                  opacity: 0.85,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                  border: '2.5px solid rgba(255,255,255,0.6)',
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  padding: 8,
                }}
              >
                {dragOverlay.blockData.feedJson.productName}
              </div>
            ) : (
              <div
                style={{
                  width: dragOverlay.w * effectiveScale,
                  height: dragOverlay.h * effectiveScale,
                  backgroundColor: '#e3f2fd',
                  border: '2px dashed #1565C0',
                  borderRadius: 6,
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#1565C0',
                }}
              >
                {dragOverlay.blockData.feedJson.productName}
              </div>
            )
          )}
        </DragOverlay>
      </DndContext>

      {/* Template selector modal */}
      {showTemplateSelector && templateSelectorPageId && (
        <TemplateSelector pageId={templateSelectorPageId} />
      )}

      {/* Preview modal — renders the current page exactly as it will appear, no edit handles */}
      {showPreview && currentPage && (
        <div
          onClick={togglePreview}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.78)',
            zIndex: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>
              Preview — {currentPage.template?.name || 'Page'}
            </span>
            <button
              onClick={e => { e.stopPropagation(); togglePreview() }}
              style={{
                color: '#fff',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 6,
                padding: '4px 14px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Close
            </button>
          </div>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}
          >
            <PageCanvas
              page={{
                ...currentPage,
                placedBlocks: currentPage.placedBlocks.map(pb => ({
                  ...pb,
                  blockData: blockData.find(bd => bd.id === pb.blockDataId) || pb.blockData,
                })),
              }}
              allBlockData={blockData}
              mode="readonly"
              scale={0.75}
            />
          </div>
        </div>
      )}
    </div>
  )
}

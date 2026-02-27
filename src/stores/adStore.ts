import { create } from 'zustand'
import { Ad, BlockData, Section, Page, PlacedBlock, PlacedBlockOverrides, Template } from '@/types'

interface Command {
  execute: () => void
  undo: () => void
  description: string
}

interface AdStore {
  ad: Ad | null
  templates: Template[]
  isLoading: boolean
  isDirty: boolean
  lastSaved: Date | null
  history: Command[]
  historyIndex: number

  // Load
  setAd: (ad: Ad) => void
  setTemplates: (templates: Template[]) => void

  // Ad mutations
  placeBlock: (pageId: string, blockDataId: string, zoneId: string | null, x: number, y: number, width: number, height: number, blockData?: BlockData | null, zIndex?: number) => string
  replacePlacedBlockId: (oldId: string, newId: string) => void
  updatePlacedBlockData: (placedBlockId: string, newBlockDataId: string, newBlockData: BlockData) => void
  moveBlock: (placedBlockId: string, targetPageId: string, x: number, y: number) => void
  removeBlock: (placedBlockId: string) => void
  updateBlockOverride: (placedBlockId: string, overrides: Partial<PlacedBlockOverrides>) => void
  resizeBlock: (placedBlockId: string, x: number, y: number, width: number, height: number) => void

  reorderSection: (sectionId: string, newPosition: number) => void
  reorderPage: (pageId: string, newPosition: number) => void
  addSection: (name: string, themeColor?: string) => Promise<void>
  addPage: (sectionId: string, templateId?: string) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  swapTemplate: (pageId: string, templateId: string) => void

  // History
  executeCommand: (cmd: Command) => void
  undo: () => void
  redo: () => void

  // Helpers
  getPage: (pageId: string) => Page | undefined
  getSection: (sectionId: string) => Section | undefined
  markDirty: () => void
  markSaved: () => void
}

export const useAdStore = create<AdStore>((set, get) => ({
  ad: null,
  templates: [],
  isLoading: false,
  isDirty: false,
  lastSaved: null,
  history: [],
  historyIndex: -1,

  setAd(ad) {
    set({ ad, isDirty: false })
  },

  setTemplates(templates) {
    set({ templates })
  },

  getPage(pageId) {
    const { ad } = get()
    if (!ad) return undefined
    for (const section of ad.sections) {
      const page = section.pages.find(p => p.id === pageId)
      if (page) return page
    }
    return undefined
  },

  getSection(sectionId) {
    const { ad } = get()
    return ad?.sections.find(s => s.id === sectionId)
  },

  markDirty() {
    set({ isDirty: true })
  },

  markSaved() {
    set({ isDirty: false, lastSaved: new Date() })
  },

  placeBlock(pageId, blockDataId, zoneId, x, y, width, height, blockData, zIndex) {
    const clientId = crypto.randomUUID()
    const newBlock: PlacedBlock = {
      id: clientId,
      pageId,
      blockDataId,
      blockData: blockData ?? undefined, // optional pre-populated blockData prevents render race
      zoneId,
      x, y, width, height,
      zIndex: zIndex ?? 1,
      overrides: {}
    }

    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page =>
              page.id === pageId
                ? { ...page, placedBlocks: [...page.placedBlocks, newBlock] }
                : page
            )
          }))
        },
        isDirty: true
      }
    })

    return clientId
  },

  replacePlacedBlockId(oldId, newId) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page => ({
              ...page,
              placedBlocks: page.placedBlocks.map(block =>
                block.id === oldId ? { ...block, id: newId } : block
              )
            }))
          }))
        }
      }
    })
  },

  updatePlacedBlockData(placedBlockId, newBlockDataId, newBlockData) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page => ({
              ...page,
              placedBlocks: page.placedBlocks.map(block =>
                block.id === placedBlockId
                  ? { ...block, blockDataId: newBlockDataId, blockData: newBlockData }
                  : block
              )
            }))
          }))
        }
      }
    })
  },

  moveBlock(placedBlockId, targetPageId, x, y) {
    set(state => {
      if (!state.ad) return state
      let movingBlock: PlacedBlock | null = null

      // Remove from source
      const sectionsAfterRemove = state.ad.sections.map(section => ({
        ...section,
        pages: section.pages.map(page => {
          const found = page.placedBlocks.find(b => b.id === placedBlockId)
          if (found) movingBlock = { ...found, pageId: targetPageId, x, y }
          return {
            ...page,
            placedBlocks: page.placedBlocks.filter(b => b.id !== placedBlockId)
          }
        })
      }))

      if (!movingBlock) return state

      // Add to target
      return {
        ad: {
          ...state.ad,
          sections: sectionsAfterRemove.map(section => ({
            ...section,
            pages: section.pages.map(page =>
              page.id === targetPageId
                ? { ...page, placedBlocks: [...page.placedBlocks, movingBlock!] }
                : page
            )
          }))
        },
        isDirty: true
      }
    })
  },

  removeBlock(placedBlockId) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page => ({
              ...page,
              placedBlocks: page.placedBlocks.filter(b => b.id !== placedBlockId)
            }))
          }))
        },
        isDirty: true
      }
    })
  },

  updateBlockOverride(placedBlockId, overrides) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page => ({
              ...page,
              placedBlocks: page.placedBlocks.map(block =>
                block.id === placedBlockId
                  ? { ...block, overrides: { ...block.overrides, ...overrides } }
                  : block
              )
            }))
          }))
        },
        isDirty: true
      }
    })
  },

  resizeBlock(placedBlockId, x, y, width, height) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page => ({
              ...page,
              placedBlocks: page.placedBlocks.map(block =>
                block.id === placedBlockId
                  ? { ...block, x, y, width, height }
                  : block
              )
            }))
          }))
        },
        isDirty: true
      }
    })
  },

  reorderSection(sectionId, newPosition) {
    set(state => {
      if (!state.ad) return state
      const sections = [...state.ad.sections]
      const idx = sections.findIndex(s => s.id === sectionId)
      if (idx < 0) return state
      const [moved] = sections.splice(idx, 1)
      sections.splice(newPosition, 0, moved)
      return {
        ad: { ...state.ad, sections: sections.map((s, i) => ({ ...s, position: i })) },
        isDirty: true
      }
    })
  },

  reorderPage(pageId, newPosition) {
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => {
            const idx = section.pages.findIndex(p => p.id === pageId)
            if (idx < 0) return section
            const pages = [...section.pages]
            const [moved] = pages.splice(idx, 1)
            pages.splice(newPosition, 0, moved)
            return { ...section, pages: pages.map((p, i) => ({ ...p, position: i })) }
          })
        },
        isDirty: true
      }
    })
  },

  async addSection(name, themeColor) {
    const { ad } = get()
    if (!ad) return
    const res = await fetch(`/api/ads/${ad.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, themeColor })
    })
    const section = await res.json()
    set(state => ({
      ad: state.ad ? {
        ...state.ad,
        sections: [...state.ad.sections, { ...section, pages: [] }]
      } : null
    }))
  },

  async addPage(sectionId, templateId) {
    const { ad } = get()
    if (!ad) return
    const res = await fetch(`/api/ads/${ad.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, templateId })
    })
    const page = await res.json()
    set(state => ({
      ad: state.ad ? {
        ...state.ad,
        sections: state.ad.sections.map(s =>
          s.id === sectionId
            ? { ...s, pages: [...s.pages, { ...page, placedBlocks: [] }] }
            : s
        )
      } : null
    }))
  },

  async deletePage(pageId) {
    const { ad } = get()
    if (!ad) return
    // Find which section this page belongs to for fallback navigation
    await fetch(`/api/ads/${ad.id}/pages/${pageId}`, { method: 'DELETE' })
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages
              .filter(p => p.id !== pageId)
              .map((p, i) => ({ ...p, position: i })),
          })),
        },
        isDirty: true,
      }
    })
  },

  swapTemplate(pageId, templateId) {
    const { templates } = get()
    const newTemplate = templates.find(t => t.id === templateId)
    if (!newTemplate) return

    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          sections: state.ad.sections.map(section => ({
            ...section,
            pages: section.pages.map(page =>
              page.id === pageId
                ? { ...page, templateId, template: newTemplate }
                : page
            )
          }))
        },
        isDirty: true
      }
    })
  },

  executeCommand(cmd) {
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(cmd)
    if (newHistory.length > 50) newHistory.shift()
    cmd.execute()
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undo() {
    const { history, historyIndex } = get()
    if (historyIndex < 0) return
    history[historyIndex].undo()
    set({ historyIndex: historyIndex - 1 })
  },

  redo() {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    history[historyIndex + 1].execute()
    set({ historyIndex: historyIndex + 1 })
  }
}))

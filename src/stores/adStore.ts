import { create } from 'zustand'
import { Ad, BlockData, Vehicle, Page, PlacedBlock, PlacedBlockOverrides, Template } from '@/types'

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

  reorderVehicle: (vehicleId: string, newPosition: number) => void
  reorderPage: (pageId: string, newPosition: number) => void
  addVehicle: (name: string, themeColor?: string) => Promise<void>
  addPage: (vehicleId: string, templateId?: string) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  swapTemplate: (pageId: string, templateId: string) => void

  // History
  executeCommand: (cmd: Command) => void
  undo: () => void
  redo: () => void

  // Helpers
  getPage: (pageId: string) => Page | undefined
  getVehicle: (vehicleId: string) => Vehicle | undefined
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
    for (const vehicle of ad.vehicles) {
      const page = vehicle.pages.find(p => p.id === pageId)
      if (page) return page
    }
    return undefined
  },

  getVehicle(vehicleId) {
    const { ad } = get()
    return ad?.vehicles.find(v => v.id === vehicleId)
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page =>
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page => ({
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page => ({
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
      const vehiclesAfterRemove = state.ad.vehicles.map(vehicle => ({
        ...vehicle,
        pages: vehicle.pages.map(page => {
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
          vehicles: vehiclesAfterRemove.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page =>
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page => ({
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page => ({
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page => ({
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

  reorderVehicle(vehicleId, newPosition) {
    set(state => {
      if (!state.ad) return state
      const vehicles = [...state.ad.vehicles]
      const idx = vehicles.findIndex(v => v.id === vehicleId)
      if (idx < 0) return state
      const [moved] = vehicles.splice(idx, 1)
      vehicles.splice(newPosition, 0, moved)
      return {
        ad: { ...state.ad, vehicles: vehicles.map((v, i) => ({ ...v, position: i })) },
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
          vehicles: state.ad.vehicles.map(vehicle => {
            const idx = vehicle.pages.findIndex(p => p.id === pageId)
            if (idx < 0) return vehicle
            const pages = [...vehicle.pages]
            const [moved] = pages.splice(idx, 1)
            pages.splice(newPosition, 0, moved)
            return { ...vehicle, pages: pages.map((p, i) => ({ ...p, position: i })) }
          })
        },
        isDirty: true
      }
    })
  },

  async addVehicle(name, themeColor) {
    const { ad } = get()
    if (!ad) return
    const res = await fetch(`/api/ads/${ad.id}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, themeColor })
    })
    const vehicle = await res.json()
    set(state => ({
      ad: state.ad ? {
        ...state.ad,
        vehicles: [...state.ad.vehicles, { ...vehicle, pages: [] }]
      } : null
    }))
  },

  async addPage(vehicleId, templateId) {
    const { ad } = get()
    if (!ad) return
    const res = await fetch(`/api/ads/${ad.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, templateId })
    })
    const page = await res.json()
    set(state => ({
      ad: state.ad ? {
        ...state.ad,
        vehicles: state.ad.vehicles.map(v =>
          v.id === vehicleId
            ? { ...v, pages: [...v.pages, { ...page, placedBlocks: [] }] }
            : v
        )
      } : null
    }))
  },

  async deletePage(pageId) {
    const { ad } = get()
    if (!ad) return
    // Find which vehicle this page belongs to for fallback navigation
    const res = await fetch(`/api/ads/${ad.id}/pages/${pageId}`, { method: 'DELETE' })
    if (!res.ok) return // API failure — do not mutate local state
    set(state => {
      if (!state.ad) return state
      return {
        ad: {
          ...state.ad,
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages
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
          vehicles: state.ad.vehicles.map(vehicle => ({
            ...vehicle,
            pages: vehicle.pages.map(page =>
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

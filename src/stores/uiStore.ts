import { create } from 'zustand'

interface UIStore {
  selectedBlockId: string | null
  selectedPageId: string | null
  zoom: number
  activePanel: 'inspector' | 'tray' | 'template'
  isDragging: boolean
  showTemplateSelector: boolean
  templateSelectorPageId: string | null
  showPreview: boolean

  selectBlock: (id: string | null) => void
  selectPage: (id: string | null) => void
  setZoom: (zoom: number) => void
  setActivePanel: (panel: 'inspector' | 'tray' | 'template') => void
  setDragging: (isDragging: boolean) => void
  openTemplateSelector: (pageId: string) => void
  closeTemplateSelector: () => void
  togglePreview: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedBlockId: null,
  selectedPageId: null,
  zoom: 0.75,
  activePanel: 'tray',
  isDragging: false,
  showTemplateSelector: false,
  templateSelectorPageId: null,
  showPreview: false,

  selectBlock(id) {
    set({ selectedBlockId: id, activePanel: id ? 'inspector' : 'tray' })
  },

  selectPage(id) {
    set({ selectedPageId: id, selectedBlockId: null })
  },

  setZoom(zoom) {
    set({ zoom: Math.max(0.25, Math.min(2, zoom)) })
  },

  setDragging(isDragging) {
    set({ isDragging })
  },

  openTemplateSelector(pageId) {
    set({ showTemplateSelector: true, templateSelectorPageId: pageId })
  },

  closeTemplateSelector() {
    set({ showTemplateSelector: false, templateSelectorPageId: null })
  },

  togglePreview() {
    set(state => ({ showPreview: !state.showPreview }))
  },

  setActivePanel(panel) {
    set({ activePanel: panel })
  }
}))

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { PriceData, BlockData } from '@/types'

interface PriceStore {
  prices: Record<string, PriceData>
  regionalPrices: Record<string, Record<string, PriceData>>
  activeRegion: string
  recentlyUpdated: Set<string>

  getPrice: (upc: string) => PriceData | null
  setRegion: (region: string) => void
  setOverride: (upc: string, price: PriceData) => void
  importFeed: (blocks: BlockData[]) => void
  markUpdated: (upc: string) => void
  clearUpdated: (upc: string) => void
}

export const usePriceStore = create<PriceStore>()(
  subscribeWithSelector((set, get) => ({
    prices: {},
    regionalPrices: {},
    activeRegion: 'WEST_COAST',
    recentlyUpdated: new Set(),

    getPrice(upc) {
      const { activeRegion, regionalPrices, prices } = get()
      return regionalPrices[activeRegion]?.[upc] ?? prices[upc] ?? null
    },

    setRegion(region) {
      set({ activeRegion: region })
    },

    setOverride(upc, price) {
      const { activeRegion } = get()
      set(state => ({
        regionalPrices: {
          ...state.regionalPrices,
          [activeRegion]: {
            ...(state.regionalPrices[activeRegion] || {}),
            [upc]: price
          }
        },
        recentlyUpdated: new Set([...state.recentlyUpdated, upc])
      }))
      // Clear the flash after 2s
      setTimeout(() => get().clearUpdated(upc), 2000)
    },

    importFeed(blocks) {
      const newPrices: Record<string, PriceData> = {}
      const updatedUpcs: string[] = []

      for (const block of blocks) {
        const feed = block.feedJson
        if (feed.price) {
          const existing = get().prices[feed.upc]
          newPrices[feed.upc] = feed.price
          if (existing && existing.adPrice !== feed.price.adPrice) {
            updatedUpcs.push(feed.upc)
          }
        }
      }

      set(state => ({
        prices: { ...state.prices, ...newPrices },
        recentlyUpdated: new Set([...state.recentlyUpdated, ...updatedUpcs])
      }))

      updatedUpcs.forEach(upc => {
        setTimeout(() => get().clearUpdated(upc), 2000)
      })
    },

    markUpdated(upc) {
      set(state => ({
        recentlyUpdated: new Set([...state.recentlyUpdated, upc])
      }))
    },

    clearUpdated(upc) {
      set(state => {
        const next = new Set(state.recentlyUpdated)
        next.delete(upc)
        return { recentlyUpdated: next }
      })
    }
  }))
)

// ── PRICE ─────────────────────────────────────────────────────────────

export type PriceType = 'each' | 'per_lb' | 'x_for_y' | 'bogo' | 'pct_off'

export interface PriceData {
  adPrice: number | null
  priceType: PriceType
  regularPrice: number
  unitCount?: number | null
  percentOff?: number | null
  savingsText?: string
  priceDisplay: string
}

// ── BLOCK ─────────────────────────────────────────────────────────────

export type StampType =
  | 'SALE' | 'BOGO' | 'PCT_OFF' | 'HOT_DEAL'
  | 'NEW' | 'ORGANIC' | 'LOCAL' | 'SEASONAL'
  | 'MANAGERS_SPECIAL' | 'CLEARANCE'
  | 'FRESH' | 'PICKUP' | 'DELIVERY' | 'FEATURED'
  | 'EXCLUSIVE' | 'LIMITED' | 'DIGITAL_COUPON' | 'BUY_MORE'

export type StampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type DisplayMode = 'product_image' | 'lifestyle_image' | 'text_only' | 'combo' | 'combo_no_price' | 'price_circle' | 'sale_band' | 'text_overlay' | 'stamp_overlay'

export interface BlockImage {
  url: string
  altText: string
}

export interface BlockData {
  id: string
  blockId: string
  upc: string
  feedJson: {
    blockId: string
    upc: string
    productName: string
    brand?: string
    category: string
    subcategory?: string
    price: PriceData
    images: {
      product?: BlockImage | null
      lifestyle?: BlockImage | null
    }
    stamps: StampType[]
    headline: string
    description?: string
    disclaimer?: string
    additionalText?: string
    locale: string
    validFrom: string
    validTo: string
    regionId?: string
    sortPriority?: number
  }
  regionId?: string | null
  adId: string
  importedAt: string
}

export interface PlacedBlockOverrides {
  headline?: string
  description?: string
  disclaimer?: string
  priceText?: string          // overrides feedJson.priceText for sale bands
  priceFontFamily?: string    // font family for sale band price text
  priceFontSize?: number      // font size (px) for sale band price text
  displayMode?: DisplayMode
  stamps?: StampType[]
  stampPositions?: Partial<Record<StampType, StampPosition | { x: number; y: number }>>
  stampSizes?: Partial<Record<StampType, number>>           // per-stamp size in design units
  stampColors?: Partial<Record<StampType, string>>          // per-stamp background color override
  stampShapes?: Partial<Record<StampType, 'circle' | 'square' | 'pill'>>  // per-stamp shape override
  stampTexts?: Partial<Record<StampType, string>>           // per-stamp label text override
  backgroundColor?: string
  activeImage?: 'product' | 'lifestyle'
  richTextJson?: Record<string, unknown>
  // Layout of image vs price+text within the block
  // image-top (default): image top half, price+text below
  // image-bottom: price+text top, image below
  // image-left: image on left, price+text on right
  // image-right: price+text on left (Meijer style), image on right
  contentLayout?: 'image-top' | 'image-bottom' | 'image-left' | 'image-right'
  // Price circle overlay — stamp-like badge showing this block's price
  priceCircleOverlay?: boolean
  // Price circle appearance
  priceCircleRingColor?: string    // ring / label color
  priceCircleBackground?: string   // inner fill color
  // Price circle position (% within block, 0–100) and size scale
  priceX?: number
  priceY?: number
  priceScale?: number
}

export interface PlacedBlock {
  id: string
  pageId: string
  blockDataId: string
  blockData?: BlockData | null
  zoneId?: string | null
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  overrides: PlacedBlockOverrides
}

// ── TEMPLATE ──────────────────────────────────────────────────────────

export type BackgroundLayerType = 'solid' | 'gradient' | 'diagonal-split' | 'wave' | 'full-bleed-image'

export interface BackgroundLayer {
  id: string
  type: BackgroundLayerType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  color?: string
  colorTop?: string
  colorBottom?: string
  angle?: number
  overlay?: string
  imageUrl?: string
}

export type ZoneRole = 'hero' | 'featured' | 'supporting' | 'accent' | 'banner' | 'callout'
export type SizeVariant = 'hero' | 'large' | 'medium' | 'small'
export type TextLayout = 'below' | 'overlay-bottom' | 'overlay-center' | 'left' | 'right'

export interface TemplateZone {
  id: string
  role: ZoneRole
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  allowedContentTypes: DisplayMode[]
  sizeVariant: SizeVariant
  textLayout: TextLayout
  snapHint: boolean
}

export interface TemplateLayout {
  canvas: { width: number; height: number }
  backgroundLayers: BackgroundLayer[]
  zones: TemplateZone[]
}

export interface Template {
  id: string
  name: string
  category: string
  orientation: 'portrait' | 'landscape'
  layoutJson: TemplateLayout
  thumbnailUrl?: string | null
  isSystem: boolean
}

// ── AD STRUCTURE ──────────────────────────────────────────────────────

export type AdStatus = 'draft' | 'in_review' | 'approved' | 'published'
export type PageType = 'front_cover' | 'back_cover' | 'interior' | 'centerfold'

export interface Page {
  id: string
  sectionId: string
  templateId?: string | null
  template?: Template | null
  pageType: PageType
  position: number
  placedBlocks: PlacedBlock[]
}

export interface Section {
  id: string
  adId: string
  name: string
  position: number
  themeColor?: string | null
  pages: Page[]
}

export interface Ad {
  id: string
  name: string
  regionIds: string[]
  validFrom: string
  validTo: string
  status: AdStatus
  version: number
  createdById: string
  createdAt: string
  updatedAt: string
  sections: Section[]
}

// ── UI ────────────────────────────────────────────────────────────────

export interface DragState {
  type: 'from-tray' | 'reposition' | 'reorder-page' | 'reorder-section'
  blockDataId?: string
  placedBlockId?: string
  sourcePageId?: string
  sourceSectionId?: string
}

export interface Comment {
  id: string
  adId: string
  pageId?: string | null
  placedBlockId?: string | null
  text: string
  resolved: boolean
  authorId: string
  author: { id: string; name: string; email: string }
  createdAt: string
}

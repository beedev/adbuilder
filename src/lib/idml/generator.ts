/**
 * IDML Generator — converts Weekly Ad pages into an Adobe InDesign IDML package.
 *
 * Flow:
 *   Ad → pages → for each page:
 *     1. Convert template backgrounds → IDML rectangles
 *     2. Convert placed blocks → text frames + image rectangles
 *     3. Generate Story XML for each block's text content
 *   Package everything into a ZIP (.idml)
 */

import JSZip from 'jszip'
import { vcsToGeoBounds } from './coordinates'
import { containerXml } from './templates/meta'
import { designmapXml } from './templates/designmap'
import { fontsXml, graphicsXml, stylesXml } from './templates/resources'
import { spreadXml, SpreadFrame } from './templates/spread'
import { storyXml } from './templates/story'
import { formatPrice } from '../priceFormatter'
import type {
  Ad, Page, PlacedBlock, TemplateLayout,
  BackgroundLayer, PriceData, BlockData, StampType,
  PlacedBlockOverrides, DisplayMode,
} from '@/types'

// ── Public API ───────────────────────────────────────────────────────────────

export interface IdmlExportOptions {
  vehicleId?: string
  pageId?: string
}

/** Generate an IDML file (as Uint8Array) from an Ad with full nested data. */
export async function generateIdml(ad: Ad, options: IdmlExportOptions = {}): Promise<Uint8Array> {
  const pages = collectPages(ad, options)
  const ctx = new GenerationContext()

  // Process each page into a spread + stories
  for (const page of pages) {
    ctx.processPage(page)
  }

  // Package into ZIP
  return ctx.package()
}

// ── Internal context ─────────────────────────────────────────────────────────

class GenerationContext {
  private spreadIds: string[] = []
  private storyIds: string[] = []
  private spreads = new Map<string, string>()   // filename → XML content
  private stories = new Map<string, string>()   // filename → XML content
  private counter = 0

  private uid(prefix: string): string {
    return `${prefix}_${++this.counter}`
  }

  processPage(page: Page): void {
    const spreadId = this.uid('Spread')
    const pageIdml = this.uid('Page')
    const layout = page.template?.layoutJson as TemplateLayout | undefined
    const isLandscape = layout
      ? layout.canvas.width > layout.canvas.height
      : false

    const frames: SpreadFrame[] = []

    // 1. Background layers
    if (layout?.backgroundLayers) {
      for (const bg of layout.backgroundLayers) {
        frames.push(...this.backgroundToFrames(bg, isLandscape))
      }
    }

    // 2. Placed blocks
    const sortedBlocks = [...page.placedBlocks].sort(
      (a, b) => a.zIndex - b.zIndex,
    )
    for (const pb of sortedBlocks) {
      frames.push(...this.blockToFrames(pb, isLandscape))
    }

    // Generate spread XML
    const xml = spreadXml(spreadId, pageIdml, frames, isLandscape)
    this.spreadIds.push(spreadId)
    this.spreads.set(`Spreads/${spreadId}.xml`, xml)
  }

  async package(): Promise<Uint8Array> {
    const zip = new JSZip()

    // mimetype MUST be first and uncompressed
    zip.file('mimetype', 'application/vnd.adobe.indesign-idml-package', {
      compression: 'STORE',
    })

    // META-INF
    zip.file('META-INF/container.xml', containerXml())

    // Resources
    zip.file('Resources/Fonts.xml', fontsXml())
    zip.file('Resources/Graphics.xml', graphicsXml())
    zip.file('Resources/Styles.xml', stylesXml())
    zip.file('Resources/Preferences.xml', preferencesXml())

    // Spreads
    for (const [path, xml] of this.spreads) {
      zip.file(path, xml)
    }

    // Stories
    for (const [path, xml] of this.stories) {
      zip.file(path, xml)
    }

    // designmap.xml (root manifest)
    zip.file('designmap.xml', designmapXml(this.spreadIds, this.storyIds))

    const buf = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      // Ensure mimetype comes first
      streamFiles: false,
    })
    return buf
  }

  // ── Background conversion ────────────────────────────────────────────────

  private backgroundToFrames(bg: BackgroundLayer, landscape: boolean): SpreadFrame[] {
    const bounds = vcsToGeoBounds(
      { x: bg.x, y: bg.y, width: bg.width, height: bg.height },
      landscape,
    )

    const fillColor = bgColorToIdml(bg)

    const frames: SpreadFrame[] = []

    if (bg.type === 'full-bleed-image' && bg.imageUrl) {
      frames.push({
        selfId: this.uid('BgImg'),
        type: 'image',
        geoBounds: bounds,
        imageUrl: bg.imageUrl,
        fillColor: 'Color/None',
        zIndex: bg.zIndex ?? 0,
      })
    } else {
      frames.push({
        selfId: this.uid('BgRect'),
        type: 'rectangle',
        geoBounds: bounds,
        fillColor,
        zIndex: bg.zIndex ?? 0,
      })
    }

    return frames
  }

  // ── Block conversion ─────────────────────────────────────────────────────

  private blockToFrames(pb: PlacedBlock, landscape: boolean): SpreadFrame[] {
    const frames: SpreadFrame[] = []
    const feed = pb.blockData?.feedJson as Record<string, unknown> | undefined
    if (!feed) return frames

    const overrides = (pb.overrides ?? {}) as PlacedBlockOverrides
    const displayMode = (overrides.displayMode ?? feed.displayMode ?? 'product_image') as DisplayMode

    const blockBounds = vcsToGeoBounds(
      { x: pb.x, y: pb.y, width: pb.width, height: pb.height },
      landscape,
    )

    // Background fill for the block
    const bgColor = overrides.backgroundColor
      ? hexToIdmlColor(overrides.backgroundColor)
      : 'Color/White'

    frames.push({
      selfId: this.uid('BlockBg'),
      type: 'rectangle',
      geoBounds: blockBounds,
      fillColor: bgColor,
      zIndex: pb.zIndex,
    })

    // Product image
    const imageUrl = resolveImageUrl(feed, overrides)
    if (imageUrl && displayMode !== 'text_only') {
      const imgBounds = imageRegion(blockBounds, displayMode)
      frames.push({
        selfId: this.uid('BlockImg'),
        type: 'image',
        geoBounds: imgBounds,
        imageUrl,
        fillColor: 'Color/None',
        zIndex: pb.zIndex + 1,
      })
    }

    // Text content (headline, description, price, disclaimer)
    const textParagraphs = buildTextParagraphs(feed, overrides)
    if (textParagraphs.length > 0) {
      const storyId = this.uid('Story')
      const xml = storyXml(storyId, textParagraphs)
      this.storyIds.push(storyId)
      this.stories.set(`Stories/${storyId}.xml`, xml)

      const textBounds = textRegion(blockBounds, displayMode, !!imageUrl)
      frames.push({
        selfId: this.uid('BlockText'),
        type: 'text',
        geoBounds: textBounds,
        storyId,
        fillColor: 'Color/None',
        zIndex: pb.zIndex + 2,
      })
    }

    // Stamps as colored rectangles with text
    const stamps = (overrides.stamps ?? feed.stamps ?? []) as StampType[]
    for (let i = 0; i < Math.min(stamps.length, 2); i++) {
      const stampFrames = this.stampToFrames(stamps[i], blockBounds, i, pb.zIndex + 3 + i, overrides)
      frames.push(...stampFrames)
    }

    return frames
  }

  private stampToFrames(
    stamp: StampType,
    blockBounds: [number, number, number, number],
    index: number,
    zIndex: number,
    overrides: PlacedBlockOverrides,
  ): SpreadFrame[] {
    const frames: SpreadFrame[] = []
    const [top, left, , right] = blockBounds
    const stampSize = 36 // points
    const offset = index * (stampSize + 4)

    const stampBounds: [number, number, number, number] = [
      top + 4,
      index === 0 ? left + 4 + offset : right - stampSize - 4 - offset,
      top + 4 + stampSize,
      index === 0 ? left + 4 + offset + stampSize : right - 4 - offset,
    ]

    // Stamp background
    const stampColors = (overrides.stampColors ?? {}) as Record<string, string>
    const color = stampColors[stamp] ? hexToIdmlColor(stampColors[stamp]) : stampColorMap(stamp)

    frames.push({
      selfId: this.uid('StampBg'),
      type: 'rectangle',
      geoBounds: stampBounds,
      fillColor: color,
      zIndex,
    })

    // Stamp label
    const stampTexts = (overrides.stampTexts ?? {}) as Record<string, string>
    const label = stampTexts[stamp] ?? stampLabel(stamp)
    const storyId = this.uid('StampStory')
    const xml = storyXml(storyId, [{ text: label, style: 'ParagraphStyle/Stamp' }])
    this.storyIds.push(storyId)
    this.stories.set(`Stories/${storyId}.xml`, xml)

    frames.push({
      selfId: this.uid('StampText'),
      type: 'text',
      geoBounds: stampBounds,
      storyId,
      fillColor: 'Color/None',
      zIndex: zIndex + 1,
    })

    return frames
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function collectPages(ad: Ad, options: IdmlExportOptions): Page[] {
  const pages: Page[] = []
  for (const vehicle of ad.vehicles) {
    if (options.vehicleId && vehicle.id !== options.vehicleId) continue
    for (const page of [...vehicle.pages].sort((a, b) => a.position - b.position)) {
      if (options.pageId && page.id !== options.pageId) continue
      pages.push(page)
    }
  }
  return pages
}

function resolveImageUrl(
  feed: Record<string, unknown>,
  overrides: PlacedBlockOverrides,
): string | undefined {
  const candidates: (string | undefined)[] = []

  if (overrides.imageUrl) candidates.push(overrides.imageUrl)

  const images = feed.images as Record<string, { url?: string } | null> | undefined
  const activeImage = overrides.activeImage as string | undefined

  if (activeImage === 'lifestyle' && images?.lifestyle?.url) {
    candidates.push(images.lifestyle.url)
  }
  candidates.push(images?.product?.url, images?.lifestyle?.url)

  // Only use HTTP(S) URLs — data URIs are too large for IDML and crash InDesign
  for (const url of candidates) {
    if (url && url.startsWith('http')) return url
  }
  return undefined
}

function buildTextParagraphs(
  feed: Record<string, unknown>,
  overrides: PlacedBlockOverrides,
): Array<{ text: string; style: string }> {
  const paragraphs: Array<{ text: string; style: string }> = []

  const productName = (feed.productName as string) ?? ''
  const headline = overrides.headline ?? (feed.headline as string) ?? ''
  const description = overrides.description ?? (feed.description as string) ?? ''
  const disclaimer = overrides.disclaimer ?? (feed.disclaimer as string) ?? ''
  const price = feed.price as PriceData | undefined

  if (productName) {
    paragraphs.push({ text: productName, style: 'ParagraphStyle/ProductName' })
  }
  if (headline) {
    paragraphs.push({ text: headline, style: 'ParagraphStyle/Headline' })
  }
  if (price) {
    const priceText = overrides.priceText ?? formatPrice(price)
    const isPromo = price.priceType === 'bogo' || price.priceType === 'pct_off'
    paragraphs.push({
      text: priceText,
      style: isPromo ? 'ParagraphStyle/PromoPrice' : 'ParagraphStyle/Price',
    })
  }
  if (description) {
    paragraphs.push({ text: description, style: 'ParagraphStyle/Body' })
  }
  if (disclaimer) {
    paragraphs.push({ text: disclaimer, style: 'ParagraphStyle/Disclaimer' })
  }

  return paragraphs
}

/** Compute image region within block bounds based on display mode. */
function imageRegion(
  bounds: [number, number, number, number],
  displayMode: DisplayMode,
): [number, number, number, number] {
  const [top, left, bottom, right] = bounds
  const height = bottom - top
  const width = right - left

  switch (displayMode) {
    case 'lifestyle_image':
    case 'text_overlay':
      return bounds // full block
    case 'combo':
    case 'product_image':
    default:
      // Image takes top 58% of block
      return [top, left, top + height * 0.58, right]
    case 'combo_no_price':
      return [top, left, top + height * 0.55, right]
    case 'price_circle':
      return bounds
  }
}

/** Compute text region within block bounds based on display mode. */
function textRegion(
  bounds: [number, number, number, number],
  displayMode: DisplayMode,
  hasImage: boolean,
): [number, number, number, number] {
  const [top, left, bottom, right] = bounds
  const height = bottom - top

  if (!hasImage || displayMode === 'text_only') return bounds

  switch (displayMode) {
    case 'text_overlay':
      // Overlay at bottom 30%
      return [bottom - height * 0.3, left, bottom, right]
    case 'lifestyle_image':
      // Text below image
      return [bottom - height * 0.2, left, bottom, right]
    case 'combo':
    case 'product_image':
    default:
      // Text in bottom 42%
      return [top + height * 0.58, left, bottom, right]
    case 'combo_no_price':
      return [top + height * 0.55, left, bottom, right]
    case 'price_circle':
      return [top + height * 0.7, left, bottom, right]
  }
}

function bgColorToIdml(bg: BackgroundLayer): string {
  if (bg.type === 'solid' && bg.color) return hexToIdmlColor(bg.color)
  if (bg.type === 'gradient' && bg.colorTop) return hexToIdmlColor(bg.colorTop)
  if (bg.type === 'diagonal-split' && bg.color) return hexToIdmlColor(bg.color)
  if (bg.type === 'wave' && bg.color) return hexToIdmlColor(bg.color)
  return 'Color/White'
}

/** Convert hex color (#RRGGBB) to an inline IDML Color Self reference.
 *  For simplicity we use the closest named swatch or inline the RGB. */
function hexToIdmlColor(hex: string): string {
  const clean = hex.replace('#', '').toLowerCase()
  // Map known brand colors
  if (clean === 'c8102e') return 'Color/MeijerRed'
  if (clean === '1b5e20') return 'Color/MeijerGreen'
  if (clean === 'f9a825') return 'Color/MeijerGold'
  if (clean === '000000') return 'Color/Black'
  if (clean === 'ffffff') return 'Color/White'
  if (clean === 'f5f5f5') return 'Color/LightGray'
  // Default to white for unknown colors (IDML inline colors need pre-registration)
  return 'Color/White'
}

function stampColorMap(stamp: StampType): string {
  const map: Partial<Record<StampType, string>> = {
    SALE: 'Color/MeijerRed',
    BOGO: 'Color/MeijerRed',
    PCT_OFF: 'Color/MeijerRed',
    CLEARANCE: 'Color/MeijerGold',
    NEW: 'Color/MeijerGreen',
    ORGANIC: 'Color/MeijerGreen',
    FRESH: 'Color/MeijerGreen',
    LOCAL: 'Color/MeijerGreen',
    DIGITAL_COUPON: 'Color/MeijerRed',
    SEASONAL: 'Color/MeijerGold',
    LIMITED: 'Color/MeijerRed',
    EXCLUSIVE: 'Color/MeijerRed',
  }
  return map[stamp] ?? 'Color/MeijerRed'
}

function stampLabel(stamp: StampType): string {
  return stamp.replace(/_/g, ' ')
}

/** Minimal Preferences.xml — required by designmap but mostly empty. */
function preferencesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Preferences xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <DocumentPreference PageHeight="792" PageWidth="612"
    PagesPerDocument="1" FacingPages="false"
    DocumentBleedTopOffset="0" DocumentBleedBottomOffset="0"
    DocumentBleedInsideOrLeftOffset="0" DocumentBleedOutsideOrRightOffset="0"
    ColumnGuideColor="IndigoLight" MarginGuideColor="IndigoLight" />
  <TextDefault />
  <GridPreference />
  <GuidePreference />
  <MarginPreference ColumnCount="1" ColumnGutter="12"
    Top="36" Bottom="36" Left="36" Right="36" />
</idPkg:Preferences>`
}

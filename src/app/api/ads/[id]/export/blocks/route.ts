import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ads/[id]/export/blocks
 *
 * Export all placed blocks for an ad, organized by section → page → block.
 * Each block includes the full feed data (product info, price, images, text)
 * merged with any designer overrides applied in the builder.
 *
 * Query params:
 *   sectionId  — filter to a specific section (optional)
 *   pageId     — filter to a specific page (optional)
 *
 * Response shape:
 * {
 *   adId:      string
 *   adName:    string
 *   validFrom: string
 *   validTo:   string
 *   sections: [
 *     {
 *       sectionId:   string
 *       sectionName: string
 *       position:    number
 *       pages: [
 *         {
 *           pageId:    string
 *           pageType:  string
 *           position:  number
 *           blocks: [
 *             {
 *               placedBlockId: string
 *               blockDataId:   string
 *               zoneId:        string | null
 *               layout: { x, y, width, height, zIndex }
 *
 *               // merged data (overrides take precedence over feed)
 *               upc:           string
 *               blockType:     "product" | "promotional"
 *               productName:   string
 *               brand:         string
 *               category:      string
 *               subcategory:   string
 *               displayMode:   string
 *               headline:      string
 *               description:   string
 *               disclaimer:    string
 *               backgroundColor: string
 *
 *               price: PriceData | null
 *               priceText: string | undefined     // promo blocks free-form price
 *               pricePosition: { x, y, scale }   // if overridden
 *
 *               images: {
 *                 active: "product" | "lifestyle"
 *                 product:   { url, altText } | null
 *                 lifestyle: { url, altText } | null
 *               }
 *
 *               stamps: string[]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adId } = await params
  const { searchParams } = new URL(req.url)
  const filterSectionId = searchParams.get('sectionId')
  const filterPageId = searchParams.get('pageId')

  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      sections: {
        where: filterSectionId ? { id: filterSectionId } : undefined,
        orderBy: { position: 'asc' },
        include: {
          pages: {
            where: filterPageId ? { id: filterPageId } : undefined,
            orderBy: { position: 'asc' },
            include: {
              placedBlocks: {
                orderBy: { zIndex: 'asc' },
                include: { blockData: true },
              },
            },
          },
        },
      },
    },
  })

  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

  const sections = ad.sections.map((section) => ({
    sectionId: section.id,
    sectionName: section.name,
    position: section.position,
    pages: section.pages.map((page) => ({
      pageId: page.id,
      pageType: page.pageType,
      position: page.position,
      blocks: page.placedBlocks.map((pb) => {
        const feed = (pb.blockData?.feedJson as Record<string, unknown>) || {}
        const overrides = (pb.overrides as Record<string, unknown>) || {}

        // Merge: overrides take precedence over feed data
        const headline = (overrides.headline as string) || (feed.headline as string) || ''
        const description =
          (overrides.description as string) || (feed.description as string) || ''
        const disclaimer =
          (overrides.disclaimer as string) || (feed.disclaimer as string) || ''
        const displayMode =
          (overrides.displayMode as string) ||
          ((feed.blockType as string) === 'promotional' ? 'sale_band' : 'product_image')
        const backgroundColor = (overrides.backgroundColor as string) || '#FFFFFF'
        const activeImage =
          (overrides.activeImage as string) ||
          (displayMode === 'lifestyle_image' ? 'lifestyle' : 'product')
        const stamps =
          (overrides.stamps as string[]) || (feed.stamps as string[]) || []

        const feedImages = (feed.images as Record<string, unknown>) || {}

        // Price position overrides
        const priceX = overrides.priceX as number | undefined
        const priceY = overrides.priceY as number | undefined
        const priceScale = overrides.priceScale as number | undefined
        const hasPriceOverride =
          priceX !== undefined || priceY !== undefined || priceScale !== undefined

        return {
          placedBlockId: pb.id,
          blockDataId: pb.blockDataId,
          zoneId: pb.zoneId || null,

          layout: {
            x: pb.x,
            y: pb.y,
            width: pb.width,
            height: pb.height,
            zIndex: pb.zIndex,
          },

          // Product / promo identity
          upc: pb.blockData?.upc || (feed.upc as string) || '',
          blockType: (feed.blockType as string) || 'product',
          productName: (feed.productName as string) || '',
          brand: (feed.brand as string) || '',
          category: (feed.category as string) || '',
          subcategory: (feed.subcategory as string) || '',

          // Display
          displayMode,
          headline,
          description,
          disclaimer,
          backgroundColor,

          // Price
          price: (feed.price as object | null) || null,
          priceText: (feed.priceText as string) || undefined,
          ...(hasPriceOverride
            ? {
                pricePosition: {
                  x: priceX ?? 50,
                  y: priceY ?? 50,
                  scale: priceScale ?? 1,
                },
              }
            : {}),

          // Images
          images: {
            active: activeImage,
            product: (feedImages.product as { url: string; altText: string } | null) || null,
            lifestyle:
              (feedImages.lifestyle as { url: string; altText: string } | null) || null,
          },

          // Stamps
          stamps,

          // Validity
          validFrom: (feed.validFrom as string) || null,
          validTo: (feed.validTo as string) || null,
          regionId: pb.blockData?.regionId || null,
        }
      }),
    })),
  }))

  return NextResponse.json({
    adId: ad.id,
    adName: ad.name,
    validFrom: ad.validFrom,
    validTo: ad.validTo,
    status: ad.status,
    exportedAt: new Date().toISOString(),
    totalBlocks: sections.reduce(
      (sum, s) => sum + s.pages.reduce((ps, p) => ps + p.blocks.length, 0),
      0
    ),
    sections,
  })
}

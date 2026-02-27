import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/ads/[id]/blocks/ingest
 *
 * Bulk-ingest blocks into an ad's block library. Each item in the array is
 * a rich structured block (product OR promotional) with explicit image, price,
 * and text fields. Returns the created BlockData records.
 *
 * Body: Array of IngestBlock objects (or a single object)
 *
 * IngestBlock shape:
 * {
 *   upc?:             string          // UPC; leave blank for promo blocks
 *   blockType?:       "product" | "promotional"  // default: "product"
 *   productName:      string
 *   brand?:           string
 *   category?:        string          // default: "General"
 *   subcategory?:     string
 *
 *   // price — provide ONE of the following structures:
 *   price?: {
 *     priceType:    "each" | "per_lb" | "x_for_y" | "bogo" | "pct_off"
 *     adPrice?:     number | null
 *     regularPrice: number
 *     unitCount?:   number | null     // for x_for_y
 *     percentOff?:  number | null     // for pct_off
 *     savingsText?: string
 *     priceDisplay: string            // human-readable fallback e.g. "2/$8"
 *   }
 *   priceText?:     string            // free-form price text for promo blocks e.g. "$1"
 *
 *   // images
 *   productImageUrl?:   string        // URL to product cut-out image
 *   lifestyleImageUrl?: string        // URL to lifestyle / hero image
 *
 *   // content
 *   headline?:      string
 *   description?:   string
 *   disclaimer?:    string
 *   additionalText?: string
 *
 *   // merchandising
 *   stamps?:        string[]          // stamp type codes
 *   sortPriority?:  number
 *
 *   // date range
 *   validFrom?:     string            // ISO date, default: today
 *   validTo?:       string            // ISO date, default: +7 days
 *   regionId?:      string
 * }
 */

interface IngestBlock {
  upc?: string
  blockType?: string
  productName: string
  brand?: string
  category?: string
  subcategory?: string
  price?: {
    priceType: string
    adPrice?: number | null
    regularPrice: number
    unitCount?: number | null
    percentOff?: number | null
    savingsText?: string
    priceDisplay: string
  }
  priceText?: string
  productImageUrl?: string
  lifestyleImageUrl?: string
  headline?: string
  description?: string
  disclaimer?: string
  additionalText?: string
  stamps?: string[]
  sortPriority?: number
  validFrom?: string
  validTo?: string
  regionId?: string
}

function buildFeedJson(block: IngestBlock, blockId: string) {
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return {
    blockId,
    blockType: block.blockType || 'product',
    upc: block.upc || '',
    productName: block.productName,
    brand: block.brand || '',
    category: block.category || 'General',
    subcategory: block.subcategory || '',
    price: block.price || null,
    priceText: block.priceText || undefined,
    images: {
      product: block.productImageUrl
        ? { url: block.productImageUrl, altText: block.productName }
        : null,
      lifestyle: block.lifestyleImageUrl
        ? { url: block.lifestyleImageUrl, altText: `${block.productName} lifestyle` }
        : null,
    },
    stamps: block.stamps || [],
    headline: block.headline || block.productName,
    description: block.description || '',
    disclaimer: block.disclaimer || '',
    additionalText: block.additionalText || '',
    locale: 'en-US',
    validFrom: block.validFrom || now.toISOString(),
    validTo: block.validTo || weekLater.toISOString(),
    regionId: block.regionId || undefined,
    sortPriority: block.sortPriority ?? 0,
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adId } = await params

  // Verify ad exists
  const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true } })
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

  const body = await req.json()
  const items: IngestBlock[] = Array.isArray(body) ? body : [body]

  if (items.length === 0) {
    return NextResponse.json({ error: 'No blocks provided' }, { status: 400 })
  }

  const created = await Promise.all(
    items.map((item) => {
      const blockId = crypto.randomUUID()
      return prisma.blockData.create({
        data: {
          blockId,
          upc: item.upc || '',
          feedJson: buildFeedJson(item, blockId) as any,
          regionId: item.regionId || null,
          adId,
        },
      })
    })
  )

  return NextResponse.json(
    {
      ingested: created.length,
      blocks: created.map((b) => ({
        id: b.id,
        blockId: b.blockId,
        upc: b.upc,
        productName: (b.feedJson as any).productName,
        blockType: (b.feedJson as any).blockType || 'product',
      })),
    },
    { status: 201 }
  )
}

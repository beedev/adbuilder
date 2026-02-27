import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adId } = await params
  const body = await req.json()

  const blockId = crypto.randomUUID()

  const block = await prisma.blockData.create({
    data: {
      blockId,
      upc: body.upc || '',
      feedJson: {
        blockId,
        blockType: body.blockType || 'product',
        upc: body.upc || '',
        productName: body.productName,
        brand: body.brand || '',
        category: body.category || 'General',
        subcategory: body.subcategory || '',
        price: body.price || null,
        priceText: body.priceText || undefined,
        images: {
          product: body.productImageUrl
            ? { url: body.productImageUrl, altText: body.productName }
            : null,
          lifestyle: body.lifestyleImageUrl
            ? { url: body.lifestyleImageUrl, altText: body.productName + ' lifestyle' }
            : null,
        },
        stamps: body.stamps || [],
        headline: body.headline || body.productName,
        description: body.description || '',
        disclaimer: body.disclaimer || '',
        locale: 'en-US',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      } as any,
      regionId: null,
      adId,
    },
  })

  return NextResponse.json(block, { status: 201 })
}

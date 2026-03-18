import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateIdml } from '@/lib/idml/generator'
import type { Ad } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { position: 'asc' },
        include: {
          pages: {
            orderBy: { position: 'asc' },
            include: {
              placedBlocks: {
                orderBy: { zIndex: 'asc' },
                include: { blockData: true },
              },
              template: true,
            },
          },
        },
      },
    },
  })

  if (!ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get('vehicleId') ?? undefined
  const pageId = searchParams.get('pageId') ?? undefined

  try {
    const idmlBuffer = await generateIdml(ad as unknown as Ad, { vehicleId, pageId })

    const safeName = ad.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const filename = `weekly-ad-${safeName}.idml`

    return new Response(idmlBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.adobe.indesign-idml-package',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(idmlBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[IDML Export] Generation failed:', err)
    const message = err instanceof Error ? err.message : 'IDML generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

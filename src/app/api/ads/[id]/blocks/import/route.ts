import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params

  const contentType = req.headers.get('content-type') || ''
  let blocks: Record<string, unknown>[]

  if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    const { parseFeed } = await import('@/lib/feedParser')
    const text = await req.text()
    blocks = parseFeed(text, 'xml') as Record<string, unknown>[]
  } else {
    const body = await req.json()
    blocks = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[]
  }

  const created = await Promise.all(
    blocks.map((block) => {
      const blockId = (block.blockId as string) || (block.id as string) || `import-${Date.now()}-${Math.random()}`
      return prisma.blockData.create({
        data: {
          blockId,
          upc: (block.upc as string) || '',
          feedJson: block as any,
          regionId: block.regionId as string | undefined,
          adId
        }
      })
    })
  )

  return NextResponse.json({ imported: created.length, blockIds: created.map((b) => b.id) })
}

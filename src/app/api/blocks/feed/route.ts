import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { adId, blocks } = body as { adId: string; blocks: Record<string, unknown>[] }

  if (!adId || !blocks) {
    return NextResponse.json({ error: 'adId and blocks required' }, { status: 400 })
  }

  const created = await Promise.all(
    blocks.map((block) =>
      prisma.blockData.create({
        data: {
          blockId: (block.blockId as string) || (block.id as string),
          upc: (block.upc as string) || '',
          feedJson: block as any,
          regionId: block.regionId as string | undefined,
          adId
        }
      })
    )
  )

  return NextResponse.json({ imported: created.length })
}

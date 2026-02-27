import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          pages: {
            include: {
              placedBlocks: { include: { blockData: true } },
              template: true
            }
          }
        }
      }
    }
  })
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Snapshot before status change
  await prisma.adVersion.create({
    data: {
      adId: id,
      version: ad.version,
      snapshot: ad as any,
      triggeredBy: 'submit'
    }
  })

  const updated = await prisma.ad.update({
    where: { id },
    data: { status: 'in_review', version: { increment: 1 } }
  })

  return NextResponse.json(updated)
}

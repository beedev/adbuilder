import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  const placed = await prisma.placedBlock.create({
    data: {
      pageId: body.pageId,
      blockDataId: body.blockDataId,
      zoneId: body.zoneId,
      x: body.x,
      y: body.y,
      width: body.width,
      height: body.height,
      zIndex: body.zIndex || 1,
      overrides: body.overrides || {}
    },
    include: { blockData: true }
  })

  // Audit log — non-critical, swallow errors
  let userId = body.userId
  if (!userId) {
    const user = await prisma.user.findFirst({ where: { role: 'designer' } })
    userId = user?.id
  }
  if (userId) {
    await prisma.auditLog
      .create({
        data: {
          adId,
          action: 'block.placed',
          entityType: 'placed_block',
          entityId: placed.id,
          newVal: { pageId: body.pageId, blockDataId: body.blockDataId } as any,
          userId
        }
      })
      .catch(() => {})
  }

  return NextResponse.json(placed, { status: 201 })
}

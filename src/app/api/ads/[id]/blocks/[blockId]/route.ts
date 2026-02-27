import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { blockId } = await params
  const body = await req.json()

  const existing = await prisma.placedBlock.findUnique({ where: { id: blockId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.placedBlock.update({
    where: { id: blockId },
    data: {
      ...(body.x !== undefined && { x: body.x }),
      ...(body.y !== undefined && { y: body.y }),
      ...(body.width !== undefined && { width: body.width }),
      ...(body.height !== undefined && { height: body.height }),
      ...(body.zIndex !== undefined && { zIndex: body.zIndex }),
      ...(body.zoneId !== undefined && { zoneId: body.zoneId }),
      ...(body.overrides !== undefined && {
        overrides: { ...(existing.overrides as object), ...body.overrides }
      })
    },
    include: { blockData: true }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { blockId } = await params
  await prisma.placedBlock.delete({ where: { id: blockId } })
  return NextResponse.json({ success: true })
}

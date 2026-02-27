import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updated = await prisma.ad.update({
    where: { id },
    data: { status: 'draft' }
  })

  if (body.notes) {
    const approver = await prisma.user.findFirst({ where: { role: 'approver' } })
    if (approver) {
      await prisma.comment.create({
        data: {
          adId: id,
          pageId: body.pageId,
          placedBlockId: body.blockId,
          text: body.notes,
          authorId: approver.id
        }
      })
    }
  }

  return NextResponse.json(updated)
}

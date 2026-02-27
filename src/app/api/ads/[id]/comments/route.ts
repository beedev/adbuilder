import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const comments = await prisma.comment.findMany({
    where: { adId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  let authorId = body.authorId
  if (!authorId) {
    const author = await prisma.user.findFirst({ where: { role: body.role || 'approver' } })
    if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 400 })
    authorId = author.id
  }

  const comment = await prisma.comment.create({
    data: {
      adId,
      pageId: body.pageId,
      placedBlockId: body.blockId,
      text: body.text,
      authorId
    },
    include: { author: { select: { id: true, name: true, email: true } } }
  })
  return NextResponse.json(comment, { status: 201 })
}

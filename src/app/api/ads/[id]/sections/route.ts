import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  const count = await prisma.section.count({ where: { adId } })
  const section = await prisma.section.create({
    data: {
      adId,
      name: body.name,
      position: count,
      themeColor: body.themeColor
    },
    include: { pages: true }
  })
  return NextResponse.json(section, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  // Bulk reorder sections
  await Promise.all(
    (body.sections as { id: string; position: number }[]).map((s) =>
      prisma.section.update({ where: { id: s.id, adId }, data: { position: s.position } })
    )
  )
  return NextResponse.json({ success: true })
}

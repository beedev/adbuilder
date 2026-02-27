import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _adId } = await params
  const body = await req.json()

  const count = await prisma.page.count({ where: { sectionId: body.sectionId } })
  const page = await prisma.page.create({
    data: {
      sectionId: body.sectionId,
      templateId: body.templateId,
      pageType: body.pageType || 'interior',
      position: count
    },
    include: {
      template: true,
      placedBlocks: { include: { blockData: true } }
    }
  })
  return NextResponse.json(page, { status: 201 })
}

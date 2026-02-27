import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params
  const body = await req.json()
  const page = await prisma.page.update({
    where: { id: pageId },
    data: {
      ...(body.templateId !== undefined && { templateId: body.templateId }),
      ...(body.pageType && { pageType: body.pageType }),
      ...(body.position !== undefined && { position: body.position })
    },
    include: {
      template: true,
      placedBlocks: { include: { blockData: true } }
    }
  })
  return NextResponse.json(page)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params
  await prisma.page.delete({ where: { id: pageId } })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          pages: {
            include: {
              placedBlocks: {
                include: { blockData: true },
                orderBy: { zIndex: 'asc' }
              },
              template: true
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  })
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ad)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const ad = await prisma.ad.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.regionIds && { regionIds: body.regionIds }),
      ...(body.validFrom && { validFrom: new Date(body.validFrom) }),
      ...(body.validTo && { validTo: new Date(body.validTo) }),
    },
    include: {
      sections: {
        include: {
          pages: {
            include: {
              placedBlocks: { include: { blockData: true } },
              template: true
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  })
  return NextResponse.json(ad)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.ad.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

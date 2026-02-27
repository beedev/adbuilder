import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const ads = await prisma.ad.findMany({
    include: {
      sections: {
        include: {
          pages: {
            include: {
              placedBlocks: {
                include: { blockData: true }
              },
              template: true
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(ads)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  let createdById = body.createdById
  if (!createdById) {
    const user = await prisma.user.findFirst({ where: { role: 'designer' } })
    if (!user) return NextResponse.json({ error: 'No designer user found' }, { status: 400 })
    createdById = user.id
  }

  const ad = await prisma.ad.create({
    data: {
      name: body.name,
      regionIds: body.regionIds || ['WEST_COAST'],
      validFrom: new Date(body.validFrom),
      validTo: new Date(body.validTo),
      status: 'draft',
      createdById
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
  return NextResponse.json(ad, { status: 201 })
}

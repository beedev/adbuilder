import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const overrides = await prisma.priceOverride.findMany({ where: { adId } })
  return NextResponse.json(overrides)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  const user = await prisma.user.findFirst({ where: { role: 'designer' } })
  if (!user) return NextResponse.json({ error: 'No designer user found' }, { status: 400 })

  const regionId = body.regionId || 'WEST_COAST'

  const override = await prisma.priceOverride.upsert({
    where: { adId_upc_regionId: { adId, upc: body.upc, regionId } },
    update: { price: body.price as any },
    create: {
      adId,
      upc: body.upc,
      regionId,
      price: body.price as any,
      setById: user.id
    }
  })

  // Audit log — non-critical
  await prisma.auditLog
    .create({
      data: {
        adId,
        action: 'price.changed',
        entityType: 'price_override',
        entityId: override.id,
        newVal: body.price as any,
        userId: user.id
      }
    })
    .catch(() => {})

  return NextResponse.json(override)
}

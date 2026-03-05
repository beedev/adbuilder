import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  const count = await prisma.vehicle.count({ where: { adId } })
  const vehicle = await prisma.vehicle.create({
    data: {
      adId,
      name: body.name,
      position: count,
      themeColor: body.themeColor
    },
    include: { pages: true }
  })
  return NextResponse.json(vehicle, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const body = await req.json()

  // Bulk reorder vehicles
  await Promise.all(
    (body.vehicles as { id: string; position: number }[]).map((v) =>
      prisma.vehicle.update({ where: { id: v.id, adId }, data: { position: v.position } })
    )
  )
  return NextResponse.json({ success: true })
}

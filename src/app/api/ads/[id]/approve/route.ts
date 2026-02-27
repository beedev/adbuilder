import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updated = await prisma.ad.update({
    where: { id },
    data: { status: 'approved' }
  })
  return NextResponse.json(updated)
}

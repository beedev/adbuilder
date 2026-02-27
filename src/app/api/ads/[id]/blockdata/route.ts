import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const blocks = await prisma.blockData.findMany({
    where: { adId },
    orderBy: [{ importedAt: 'asc' }]
  })
  return NextResponse.json(blocks)
}

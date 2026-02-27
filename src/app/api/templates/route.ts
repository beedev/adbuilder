import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.template.findMany({
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }]
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const template = await prisma.template.create({
    data: {
      name: body.name,
      category: body.category || 'promotional',
      orientation: body.orientation || 'portrait',
      layoutJson: body.layoutJson,
      thumbnailUrl: body.thumbnailUrl || null,
      isSystem: false,
    }
  })
  return NextResponse.json(template, { status: 201 })
}

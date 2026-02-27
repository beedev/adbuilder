import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAdPdf } from '@/lib/pdf'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await generateAdPdf(id)

    const safeName = ad.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const filename = `weekly-ad-${safeName}.pdf`

    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[PDF Export] Generation failed:', err)
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

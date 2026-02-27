import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const region = (body.region as string) || 'WEST_COAST'

  // Returns a job ID — full Puppeteer/worker integration would queue a BullMQ job in production
  const jobId = `pdf-${id}-${region}-${Date.now()}`

  return NextResponse.json({
    jobId,
    message: 'PDF export queued',
    previewUrl: `/preview/${id}?region=${region}&print=true`
  })
}

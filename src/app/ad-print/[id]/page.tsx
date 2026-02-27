import { prisma } from '@/lib/prisma'
import { AdPrintPages } from '@/components/print/AdPrintPages'
import { Ad } from '@/types'

export default async function AdPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { position: 'asc' },
        include: {
          pages: {
            orderBy: { position: 'asc' },
            include: {
              placedBlocks: {
                orderBy: { zIndex: 'asc' },
                include: { blockData: true },
              },
              template: true,
            },
          },
        },
      },
    },
  })

  if (!ad) {
    return (
      <div style={{ padding: 40, color: '#666', fontSize: 14 }}>
        Ad not found (id: {id})
      </div>
    )
  }

  return <AdPrintPages ad={ad as unknown as Ad} />
}

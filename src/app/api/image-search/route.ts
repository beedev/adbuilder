import { NextRequest, NextResponse } from 'next/server'

const BRAND_PREFIXES =
  /^(meijer|kroger|walmart|great value|store brand|kirkland|costco|target|365|whole foods|trader joe'?s|publix|aldi|simple truth|generic)\s+/gi

const NOISE_WORDS =
  /\b(fresh|organic|natural|premium|select|classic|original|reduced[- ]fat|low[- ]fat|fat[- ]free|non[- ]fat|sugar[- ]free|light|lite|extra|super|mini|large|small|medium|family|jumbo|value|wild[- ]caught|farm[- ]raised|free[- ]range|cage[- ]free|grass[- ]fed|all[- ]natural|roasted|grilled|baked|frozen|canned|raw|ripe|sweet|crispy|crunchy|spicy|mild|hot|boneless|skinless|sliced|diced|chopped|shredded|grated|ground|chunk|pieces|pack|count|oz|lb|fl|ct)\b\s*/gi

function cleanQuery(raw: string): string {
  let q = raw.replace(BRAND_PREFIXES, '').trim()
  q = q.replace(NOISE_WORDS, '').trim()
  q = q.replace(/\s+/g, ' ').trim()
  return q || raw.trim()
}

async function searchWikimedia(
  term: string,
  signal: AbortSignal
): Promise<{ url: string; label: string }[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${term} food`,
    gsrnamespace: '6', // File namespace
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iilimit: '1',
    format: 'json',
    gsrlimit: '16',
    origin: '*',
  })

  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    {
      headers: { 'User-Agent': 'WeeklyAdBuilder/1.0' },
      signal,
    }
  )
  if (!res.ok) return []

  const data = await res.json()
  const pages = Object.values(
    (data.query?.pages ?? {}) as Record<string, unknown>
  ) as Record<string, unknown>[]

  const images: { url: string; label: string }[] = []
  for (const page of pages) {
    const info = (page.imageinfo as Record<string, unknown>[] | undefined)?.[0]
    const url = info?.url as string | undefined
    const mime = info?.mime as string | undefined
    const width = info?.width as number | undefined

    // Only JPEGs and PNGs wider than 200px
    if (!url) continue
    if (!mime || (!mime.startsWith('image/jpeg') && !mime.startsWith('image/png'))) continue
    if (width && width < 200) continue

    const rawTitle = (page.title as string) || ''
    const label = rawTitle.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ')

    images.push({ url, label })
    if (images.length >= 8) break
  }

  return images
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const cleaned = cleanQuery(q)

  try {
    const signal = AbortSignal.timeout(6000)
    let images = await searchWikimedia(cleaned, signal)

    // If multi-word query returned nothing, retry with just the last noun
    if (images.length === 0 && cleaned.includes(' ')) {
      const lastWord = cleaned.split(' ').at(-1)!
      images = await searchWikimedia(lastWord, AbortSignal.timeout(6000))
    }

    return NextResponse.json(images, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch {
    return NextResponse.json([])
  }
}

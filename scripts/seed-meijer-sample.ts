/**
 * scripts/seed-meijer-sample.ts
 *
 * Creates the Meijer Weekly Ad sample page in the builder,
 * matching the front-page layout shown in the product brief.
 *
 * Run: npx tsx scripts/seed-meijer-sample.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/weekly_ad_builder'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const W = 800
const H = 1100
const AD_ID = 'dd217886-ffdc-41ad-9b0b-ac95dee77fb9'
const NOW = new Date().toISOString()
const NEXT_WEEK = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

// ─── Block definitions ──────────────────────────────────────────────────────

const BLOCKS = [
  // ── HEADER ROW ──────────────────────────────────────────────────────────
  {
    bd: {
      blockType: 'promotional',
      productName: 'Meijer Logo Header',
      category: 'Brand',
      headline: 'meijer.',
      description: '',
      stamps: [] as string[],
    },
    x: 0, y: 0, w: 270, h: 82,
    overrides: { displayMode: 'text_only', backgroundColor: '#FFFFFF' },
  },
  {
    bd: {
      blockType: 'promotional',
      productName: 'Shop Click Add to Cart Banner',
      category: 'Brand',
      headline: 'SHOP. CLICK. ADD TO CART.',
      description: 'See your savings as you shop!',
      stamps: [] as string[],
    },
    x: 270, y: 0, w: 530, h: 82,
    overrides: { displayMode: 'text_only', backgroundColor: '#1B5FAD' },
  },

  // ── LEFT COLUMN ─────────────────────────────────────────────────────────
  {
    bd: {
      upc: '0026363201210',
      blockType: 'product',
      productName: 'Boneless Chicken Tenderloins',
      brand: 'Meijer',
      category: 'Meat & Seafood',
      price: { priceType: 'per_lb', adPrice: 3.99, regularPrice: 5.99, priceDisplay: 'sale $3.99/lb' },
      stamps: ['SALE'],
      headline: 'Fresh from Meijer Family Pack',
      description:
        'Boneless Chicken Tenderloins. All natural.\nFresh from Meijer Family Pack Chicken Drumsticks. All natural..........1.29 lb',
      lifestyleImageUrl:
        'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
    },
    x: 0, y: 82, w: 390, h: 340,
    overrides: {
      contentLayout: 'image-right' as const,
      activeImage: 'lifestyle' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#C8102E',
      priceCircleBackground: '#F5E642',
      priceX: 22,
      priceY: 38,
      priceScale: 1.4,
    },
  },
  {
    bd: {
      upc: '0021421400024',
      blockType: 'product',
      productName: 'Strawberries',
      brand: 'Fresh',
      category: 'Produce',
      price: { priceType: 'bogo', adPrice: 1, regularPrice: 3.99, priceDisplay: 'BOGO $1' },
      stamps: ['BOGO'],
      headline: 'Strawberries',
      description: '16 oz. container\nor Whole Pineapple*',
      disclaimer: 'of equal or lesser value',
      lifestyleImageUrl:
        'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80',
    },
    x: 0, y: 422, w: 390, h: 300,
    overrides: {
      contentLayout: 'image-right' as const,
      activeImage: 'lifestyle' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#C8102E',
      priceCircleBackground: '#F5E642',
      priceX: 22,
      priceY: 38,
      priceScale: 1.4,
    },
  },

  // ── RIGHT COLUMN ─────────────────────────────────────────────────────────
  {
    bd: {
      upc: '0072700011100',
      blockType: 'product',
      productName: 'Meijer Potato Chips & Tortilla Chips',
      brand: 'Meijer',
      category: 'Snacks',
      price: {
        priceType: 'x_for_y',
        adPrice: 6,
        regularPrice: 2.49,
        unitCount: 3,
        priceDisplay: '3/$6',
      },
      stamps: ['SALE'],
      headline: '3/$6 when you buy 3 or more',
      description:
        'Meijer Potato Chips 7.75 oz., Tortilla Chips 9.25-13 oz., Corn Chips 10 oz. or Cheese Puffs or Curls 5-8 oz. Select varieties. Quantities less than 3 are at regular price.',
      productImageUrl:
        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
    },
    x: 390, y: 82, w: 410, h: 190,
    overrides: {
      contentLayout: 'image-right' as const,
      activeImage: 'product' as const,
    },
  },
  {
    bd: {
      upc: '0026363300018',
      blockType: 'product',
      productName: 'Meijer Ultimate or Sugar Cookies',
      brand: 'Meijer',
      category: 'Bakery',
      price: { priceType: 'each', adPrice: 3.98, regularPrice: 5.49, priceDisplay: 'sale $3.98' },
      stamps: ['SALE'],
      headline: 'Fresh from Meijer',
      description: '12 ct./10-16 oz.',
      productImageUrl:
        'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
    },
    x: 390, y: 272, w: 205, h: 190,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
    },
  },
  {
    bd: {
      upc: '0001230000001',
      blockType: 'product',
      productName: "Healthy Choice Steamers or Marie Callender's Frozen Entrée",
      brand: 'ConAgra',
      category: 'Frozen Foods',
      price: { priceType: 'each', adPrice: 1.99, regularPrice: 2.99, priceDisplay: 'sale $1.99' },
      stamps: ['SALE'],
      headline: 'Healthy Choice',
      description:
        "Healthy Choice Steamers 9-10.3 oz. or Marie Callender's Frozen Entrée 10.5-13 oz. Select varieties.",
      productImageUrl:
        'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    },
    x: 595, y: 272, w: 205, h: 190,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
    },
  },
  {
    bd: {
      upc: '0076281000010',
      blockType: 'product',
      productName: 'Starbucks',
      brand: 'Starbucks',
      category: 'Coffee & Tea',
      price: { priceType: 'each', adPrice: 8.99, regularPrice: 12.99, priceDisplay: 'sale $8.99' },
      stamps: ['SALE'],
      headline: 'Starbucks',
      description: '10-12 oz. bag, K-Cups 10 ct. or Cold Brew 32 oz. Select varieties.',
      productImageUrl:
        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80',
    },
    x: 390, y: 462, w: 205, h: 260,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
    },
  },
  {
    bd: {
      upc: '0036000413010',
      blockType: 'product',
      productName: 'Cottonelle Bath Tissue',
      brand: 'Cottonelle',
      category: 'Household',
      price: {
        priceType: 'each',
        adPrice: 4.99,
        regularPrice: 6.99,
        savingsText: '-$2 Perk',
        priceDisplay: 'final price $4.99',
      },
      stamps: ['SALE'],
      headline: 'Cottonelle Ultra Clean',
      description: 'Bath Tissue 6 mega rolls or Flushable Wipes 4 pk./42 ct.',
      disclaimer: 'sale price 6.99 • Perk -$2 • final price 4.99',
      productImageUrl:
        'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
    },
    x: 595, y: 462, w: 205, h: 260,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
    },
  },

  // ── SALE BAND ────────────────────────────────────────────────────────────
  {
    bd: {
      blockType: 'promotional',
      productName: '$1 deals 800+ items $1 each',
      category: 'Components',
      headline: '$1 deals',
      description: '800+ items $1 each',
      priceText: '$1',
      stamps: [] as string[],
    },
    x: 0, y: 722, w: 800, h: 80,
    overrides: { displayMode: 'sale_band', backgroundColor: '#C8102E' },
  },

  // ── BOTTOM $1 DEALS ───────────────────────────────────────────────────────
  {
    bd: {
      upc: '0003744100040',
      blockType: 'product',
      productName: 'Knorr Pasta or Rice Sides',
      brand: 'Knorr',
      category: 'Pasta & Rice',
      price: { priceType: 'each', adPrice: 1, regularPrice: 1.99, priceDisplay: '$1' },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Knorr Pasta or Rice Sides',
      description: '4-5.7 oz. Select varieties. Limit 10.',
      productImageUrl:
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
    },
    x: 0, y: 802, w: 200, h: 188,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#F5C400',
      priceCircleBackground: '#F5C400',
      priceX: 12,
      priceY: 62,
      priceScale: 1.1,
    },
  },
  {
    bd: {
      upc: '0026363210010',
      blockType: 'product',
      productName: 'Meijer Frozen Personal Pizza',
      brand: 'Meijer',
      category: 'Frozen Foods',
      price: { priceType: 'each', adPrice: 1, regularPrice: 2.99, priceDisplay: '$1' },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Meijer Frozen Personal Pizza',
      description: '7.2 oz. Select varieties. Limit 10.',
      productImageUrl:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    },
    x: 200, y: 802, w: 200, h: 188,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#F5C400',
      priceCircleBackground: '#F5C400',
      priceX: 12,
      priceY: 62,
      priceScale: 1.1,
    },
  },
  {
    bd: {
      upc: '0001520007000',
      blockType: 'product',
      productName: 'Sparkling Ice Flavored Sparkling Water',
      brand: 'Sparkling Ice',
      category: 'Beverages',
      price: { priceType: 'each', adPrice: 1, regularPrice: 1.99, priceDisplay: '$1' },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Sparkling Ice',
      description:
        '17 oz. bottle or Powerade Sport Drink 28 oz. bottle. Select varieties. Plus deposit where applicable. Limit 10.',
      productImageUrl:
        'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80',
    },
    x: 400, y: 802, w: 200, h: 188,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#F5C400',
      priceCircleBackground: '#F5C400',
      priceX: 12,
      priceY: 62,
      priceScale: 1.1,
    },
  },
  {
    bd: {
      upc: '0026363600030',
      blockType: 'product',
      productName: 'Meijer Facial Tissue',
      brand: 'Meijer',
      category: 'Household',
      price: { priceType: 'each', adPrice: 1, regularPrice: 2.29, priceDisplay: '$1' },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Meijer Facial Tissue',
      description: 'Flat 120-160 ct. or cube 60-70 ct. Limit 10.',
      productImageUrl:
        'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
    },
    x: 600, y: 802, w: 200, h: 188,
    overrides: {
      contentLayout: 'image-top' as const,
      activeImage: 'product' as const,
      priceCircleOverlay: true,
      priceCircleRingColor: '#F5C400',
      priceCircleBackground: '#F5C400',
      priceX: 12,
      priceY: 62,
      priceScale: 1.1,
    },
  },

  // ── FOOTER ────────────────────────────────────────────────────────────────
  {
    bd: {
      blockType: 'promotional',
      productName: 'Footer Disclaimer',
      category: 'Brand',
      headline: '*While supplies last. No rainchecks or substitutions.',
      description:
        'Prices Good Wednesday, February 25 thru Tuesday, March 3, 2026. Check Meijer.com for our store hours.',
      stamps: [] as string[],
    },
    x: 0, y: 990, w: 800, h: 110,
    overrides: { displayMode: 'text_only', backgroundColor: '#FFFFFF' },
  },
]

// ─── Template definition ─────────────────────────────────────────────────────

const TEMPLATE_LAYOUT = {
  canvas: { width: W, height: H },
  backgroundLayers: [
    // White full-page background
    { id: 'bg-white', type: 'solid', x: 0, y: 0, width: W, height: H, color: '#FFFFFF', zIndex: 0 },
    // Meijer blue header band (right side)
    { id: 'bg-blue', type: 'solid', x: 270, y: 0, width: 530, height: 82, color: '#1B5FAD', zIndex: 1 },
    // Light gray bottom section
    { id: 'bg-gray', type: 'solid', x: 0, y: 790, width: W, height: 200, color: '#F5F5F5', zIndex: 1 },
  ],
  zones: [
    { id: 'z-header-logo',  role: 'banner',     x: 0,   y: 0,   width: 270, height: 82,  zIndex: 2, allowedContentTypes: ['text_only'],                          sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
    { id: 'z-header-banner',role: 'banner',     x: 270, y: 0,   width: 530, height: 82,  zIndex: 2, allowedContentTypes: ['text_only'],                          sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
    { id: 'z-chicken',      role: 'hero',       x: 0,   y: 82,  width: 390, height: 340, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],           sizeVariant: 'hero',   textLayout: 'left',           snapHint: true  },
    { id: 'z-strawberry',   role: 'featured',   x: 0,   y: 422, width: 390, height: 300, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],           sizeVariant: 'large',  textLayout: 'left',           snapHint: true  },
    { id: 'z-chips',        role: 'featured',   x: 390, y: 82,  width: 410, height: 190, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'large',  textLayout: 'right',          snapHint: true  },
    { id: 'z-cookies',      role: 'supporting', x: 390, y: 272, width: 205, height: 190, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'medium', textLayout: 'below',          snapHint: true  },
    { id: 'z-frozen',       role: 'supporting', x: 595, y: 272, width: 205, height: 190, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'medium', textLayout: 'below',          snapHint: true  },
    { id: 'z-starbucks',    role: 'supporting', x: 390, y: 462, width: 205, height: 260, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'medium', textLayout: 'below',          snapHint: true  },
    { id: 'z-cottonelle',   role: 'supporting', x: 595, y: 462, width: 205, height: 260, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'medium', textLayout: 'below',          snapHint: true  },
    { id: 'z-sale-band',    role: 'banner',     x: 0,   y: 722, width: 800, height: 80,  zIndex: 3, allowedContentTypes: ['text_only', 'sale_band' as any],      sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: true  },
    { id: 'z-knorr',        role: 'accent',     x: 0,   y: 802, width: 200, height: 188, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'small',  textLayout: 'below',          snapHint: true  },
    { id: 'z-pizza',        role: 'accent',     x: 200, y: 802, width: 200, height: 188, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'small',  textLayout: 'below',          snapHint: true  },
    { id: 'z-sparkling',    role: 'accent',     x: 400, y: 802, width: 200, height: 188, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'small',  textLayout: 'below',          snapHint: true  },
    { id: 'z-tissue',       role: 'accent',     x: 600, y: 802, width: 200, height: 188, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],             sizeVariant: 'small',  textLayout: 'below',          snapHint: true  },
    { id: 'z-footer',       role: 'callout',    x: 0,   y: 990, width: 800, height: 110, zIndex: 2, allowedContentTypes: ['text_only'],                          sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
  ],
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏗  Seeding Meijer Weekly Ad sample page...\n')

  // 1. Verify ad exists
  const ad = await prisma.ad.findUnique({ where: { id: AD_ID } })
  if (!ad) throw new Error(`Ad ${AD_ID} not found. Run prisma/seed.ts first.`)
  console.log(`📋 Ad: ${ad.name}`)

  // 2. Upsert the "Meijer Weekly Ad" template
  const existingTemplate = await prisma.template.findFirst({
    where: { name: 'Meijer Weekly Ad Front Page' },
  })
  const template = existingTemplate
    ? await prisma.template.update({
        where: { id: existingTemplate.id },
        data: { layoutJson: TEMPLATE_LAYOUT as any },
      })
    : await prisma.template.create({
        data: {
          name: 'Meijer Weekly Ad Front Page',
          category: 'promotional',
          orientation: 'portrait',
          isSystem: false,
          layoutJson: TEMPLATE_LAYOUT as any,
        },
      })
  console.log(`📐 Template: ${template.name} (${template.id})`)

  // 3. Find or create "Meijer Weekly Ad" section
  let section = await prisma.section.findFirst({
    where: { adId: AD_ID, name: 'Meijer Weekly Ad' },
    include: { pages: true },
  })
  if (!section) {
    const sectionCount = await prisma.section.count({ where: { adId: AD_ID } })
    section = await prisma.section.create({
      data: { adId: AD_ID, name: 'Meijer Weekly Ad', position: sectionCount, themeColor: '#C8102E' },
      include: { pages: true },
    }) as any
    console.log(`📁 Created section: ${section!.name}`)
  } else {
    console.log(`📁 Found section: ${section.name}`)
  }

  // 4. Find or create the page (always clear placed blocks to start fresh)
  let page = (section as any).pages?.[0] as { id: string } | undefined
  if (page) {
    await prisma.placedBlock.deleteMany({ where: { pageId: page.id } })
    await prisma.page.update({ where: { id: page.id }, data: { templateId: template.id } })
    console.log(`📄 Cleared page: ${page.id}`)
  } else {
    page = await prisma.page.create({
      data: {
        sectionId: section!.id,
        templateId: template.id,
        pageType: 'front_cover',
        position: 0,
      },
    })
    console.log(`📄 Created page: ${page.id}`)
  }

  // 5. Ingest block data + place on page
  console.log('\n🧱 Creating blocks:\n')
  let zIndex = 1
  for (const def of BLOCKS) {
    const blockId = crypto.randomUUID()
    const bd = def.bd as any
    const feedJson: Record<string, unknown> = {
      blockId,
      blockType: bd.blockType || 'product',
      upc: bd.upc || '',
      productName: bd.productName,
      brand: bd.brand || '',
      category: bd.category || 'General',
      subcategory: '',
      price: bd.price || null,
      priceText: bd.priceText || undefined,
      images: {
        product: bd.productImageUrl
          ? { url: bd.productImageUrl, altText: bd.productName }
          : null,
        lifestyle: bd.lifestyleImageUrl
          ? { url: bd.lifestyleImageUrl, altText: bd.productName }
          : null,
      },
      stamps: bd.stamps || [],
      headline: bd.headline || bd.productName,
      description: bd.description || '',
      disclaimer: bd.disclaimer || '',
      locale: 'en-US',
      validFrom: NOW,
      validTo: NEXT_WEEK,
    }

    const blockData = await prisma.blockData.create({
      data: {
        blockId,
        upc: bd.upc || '',
        feedJson: feedJson as any,
        regionId: null,
        adId: AD_ID,
      },
    })

    await prisma.placedBlock.create({
      data: {
        pageId: page!.id,
        blockDataId: blockData.id,
        zoneId: null,
        x: def.x,
        y: def.y,
        width: def.w,
        height: def.h,
        zIndex: zIndex++,
        overrides: def.overrides as any,
      },
    })

    const price = bd.price ? `  ${bd.price.priceDisplay}` : ''
    console.log(`  ✅ [${def.x},${def.y} ${def.w}×${def.h}] ${bd.productName}${price}`)
  }

  console.log(`\n✅ ${BLOCKS.length} blocks placed`)
  console.log(`\n🔗 Open the builder and navigate to "Meijer Weekly Ad" section:`)
  console.log(`   http://localhost:3000/builder/${AD_ID}`)
  console.log(`\n   Page ID: ${page!.id}`)
}

main()
  .catch(err => { console.error('❌', err); process.exit(1) })
  .finally(() => prisma.$disconnect())

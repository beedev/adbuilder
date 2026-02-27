/**
 * seed-meijer-weekly.ts
 *
 * Recreates a Meijer weekly ad interior page with:
 *   - Chicken hero (price_circle + SALE stamp)
 *   - Chips 3-FOR promo (SALE stamp)
 *   - Two small Fresh / Healthy-Choice blocks
 *   - Red $3.99 sale band
 *   - Strawberry BOGO lifestyle (BUY1GET1 stamp + price circle)
 *   - Starbucks text block + BOGO squeeze block
 *   - Green $1 digital-deals band
 *   - 4 × Digital Coupon lifestyle blocks ($1 price circles)
 *   - Footer disclaimer
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-meijer-weekly.ts
 *
 * Prerequisite: prisma/seed.ts must have been run first (creates the ad).
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/weekly_ad_builder'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// ── constants ────────────────────────────────────────────────────────────────
const AD_ID       = 'dd217886-ffdc-41ad-9b0b-ac95dee77fb9'
const TEMPLATE_ID = 'meijer-weekly-feature-v1'

// ── template layout ──────────────────────────────────────────────────────────
// Canvas: 800 × 1100 design units
//
// Row 1 (h=255):  chicken hero (w=457) | chips 3-for (w=335)
// Row 2 (h=120):  fresh-from-meijer (w=225) | healthy-choice (w=225)
// Band 1  (h=45): red "$3.99 Special Offer" — full width
// Row 3 (h=215):  strawberry BOGO (w=457) | starbucks (h=105) / BOGO (h=105)
// Band 2  (h=40): green "$1 Digital Deals" — full width
// Row 4 (h=220):  4 × digital coupon (w=192 each)
// Footer (h=177): disclaimer
//
// Total height: 255 + 5 + 120 + 5 + 45 + 5 + 215 + 5 + 40 + 3 + 220 + 5 + 177 = 1100

const LAYOUT = {
  canvas: { width: 800, height: 1100 },
  backgroundLayers: [
    { id: 'bg-main', type: 'solid',  x: 0, y:   0, width: 800, height: 1100, color: '#FFFFFF', zIndex: 0 },
    { id: 'bg-top',  type: 'solid',  x: 0, y:   0, width: 800, height:    5, color: '#C8102E', zIndex: 1 },
    { id: 'bg-mid',  type: 'solid',  x: 0, y: 385, width: 800, height:   45, color: '#C8102E', zIndex: 1 },
    { id: 'bg-band', type: 'solid',  x: 0, y: 655, width: 800, height:   40, color: '#1B5E20', zIndex: 1 },
  ],
  zones: [
    // Row 1
    { id: 'z-chicken',   role: 'hero',       x:   0, y:   0, width: 457, height: 255, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo', 'price_circle'], sizeVariant: 'large',  textLayout: 'overlay-bottom', snapHint: true },
    { id: 'z-chips',     role: 'featured',   x: 462, y:   0, width: 335, height: 255, zIndex: 2, allowedContentTypes: ['combo', 'text_only'],                        sizeVariant: 'medium', textLayout: 'below',          snapHint: true },
    // Row 2
    { id: 'z-fresh',     role: 'supporting', x:   0, y: 260, width: 225, height: 120, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],                    sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    { id: 'z-healthy',   role: 'supporting', x: 230, y: 260, width: 225, height: 120, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],                    sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    // Band 1
    { id: 'z-band1',     role: 'banner',     x:   0, y: 385, width: 800, height:  45, zIndex: 3, allowedContentTypes: ['sale_band', 'text_only'],                    sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
    // Row 3
    { id: 'z-strawberry',role: 'featured',   x:   0, y: 435, width: 457, height: 215, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],                  sizeVariant: 'large',  textLayout: 'below',          snapHint: true },
    { id: 'z-starbucks', role: 'supporting', x: 462, y: 435, width: 335, height: 105, zIndex: 2, allowedContentTypes: ['product_image', 'combo', 'text_only'],       sizeVariant: 'medium', textLayout: 'below',          snapHint: true },
    { id: 'z-bogo',      role: 'supporting', x: 462, y: 545, width: 335, height: 105, zIndex: 2, allowedContentTypes: ['product_image', 'combo'],                    sizeVariant: 'medium', textLayout: 'below',          snapHint: true },
    // Band 2
    { id: 'z-band2',     role: 'banner',     x:   0, y: 655, width: 800, height:  40, zIndex: 3, allowedContentTypes: ['sale_band', 'text_only'],                    sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
    // Row 4 — Digital Coupons
    { id: 'z-dig1',      role: 'accent',     x:   0, y: 698, width: 192, height: 220, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],                  sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    { id: 'z-dig2',      role: 'accent',     x: 200, y: 698, width: 192, height: 220, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],                  sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    { id: 'z-dig3',      role: 'accent',     x: 400, y: 698, width: 192, height: 220, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],                  sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    { id: 'z-dig4',      role: 'accent',     x: 600, y: 698, width: 192, height: 220, zIndex: 2, allowedContentTypes: ['lifestyle_image', 'combo'],                  sizeVariant: 'small',  textLayout: 'below',          snapHint: true },
    // Footer
    { id: 'z-footer',    role: 'callout',    x:   0, y: 923, width: 800, height: 177, zIndex: 2, allowedContentTypes: ['text_only'],                                 sizeVariant: 'small',  textLayout: 'overlay-center', snapHint: false },
  ],
}

// ── block definitions ─────────────────────────────────────────────────────────

const BLOCKS = [
  // ── 1. Chicken Thighs Hero ─────────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P01',
    upc:    '041290001010',
    feedJson: {
      blockId: 'MW-2026-W10-P01',
      upc:    '041290001010',
      productName: 'Bone-In Chicken Thighs',
      brand: 'Meijer',
      category: 'Meat & Poultry',
      price: { adPrice: 1.99, priceType: 'per_lb', regularPrice: 2.99, savingsText: 'Save $1.00/lb', priceDisplay: '$1.99/lb' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500', altText: 'Raw chicken thighs' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=700', altText: 'Grilled chicken thighs plated' },
      },
      stamps: ['SALE'],
      headline: 'Bone-In Chicken Thighs',
      description: 'Fresh, never frozen — great for grilling',
      disclaimer: 'Limit 4 lbs per customer',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 1,
    },
    placed: {
      x: 0, y: 0, width: 457, height: 255, zIndex: 1, zoneId: 'z-chicken',
      overrides: {
        displayMode:         'price_circle',
        activeImage:         'lifestyle',
        stamps:              ['SALE'],
        stampPositions:      { SALE: 'top-left' },
        stampSizes:          { SALE: 58 },
        stampColors:         { SALE: '#C8102E' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#C8102E',
        priceCircleBackground:'#FFFFFF',
        priceX: 82,
        priceY: 78,
        priceScale: 1.1,
      },
    },
  },

  // ── 2. Lay's Chips — 3 for $6.00 ──────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P02',
    upc:    '028400090100',
    feedJson: {
      blockId: 'MW-2026-W10-P02',
      upc:    '028400090100',
      productName: "Lay's Potato Chips",
      brand: "Lay's",
      category: 'Snacks',
      price: { adPrice: 6.00, priceType: 'x_for_y', regularPrice: 4.29, unitCount: 3, savingsText: '3 for $6.00', priceDisplay: '3/$6.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500', altText: "Lay's chips bag" },
        lifestyle: null,
      },
      stamps: ['SALE'],
      headline: "Lay's Potato Chips",
      description: "8–9.25 oz. Selected varieties",
      disclaimer: '',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 2,
    },
    placed: {
      x: 462, y: 0, width: 335, height: 255, zIndex: 1, zoneId: 'z-chips',
      overrides: {
        displayMode:    'combo',
        stamps:         ['SALE'],
        stampPositions: { SALE: 'top-right' },
        stampSizes:     { SALE: 52 },
        stampColors:    { SALE: '#C8102E' },
        headline:       "Lay's Potato Chips",
        description:    "8–9.25 oz. Selected varieties",
      },
    },
  },

  // ── 3. Fresh from Meijer (veggies) ────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P03',
    upc:    '041290003030',
    feedJson: {
      blockId: 'MW-2026-W10-P03',
      upc:    '041290003030',
      productName: 'Fresh from Meijer Vegetables',
      brand: 'Meijer',
      category: 'Produce',
      price: { adPrice: 0.99, priceType: 'each', regularPrice: 1.49, savingsText: 'Save $0.50', priceDisplay: '99¢' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', altText: 'Fresh vegetables' },
        lifestyle: null,
      },
      stamps: ['FRESH'],
      headline: 'Fresh from Meijer',
      description: 'Selected varieties',
      disclaimer: '',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 3,
    },
    placed: {
      x: 0, y: 260, width: 225, height: 120, zIndex: 1, zoneId: 'z-fresh',
      overrides: {
        displayMode:    'combo',
        stamps:         ['FRESH'],
        stampPositions: { FRESH: 'top-left' },
        stampSizes:     { FRESH: 44 },
        stampColors:    { FRESH: '#2E7D32' },
      },
    },
  },

  // ── 4. Healthy Choice Frozen Meals ────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P04',
    upc:    '072655100049',
    feedJson: {
      blockId: 'MW-2026-W10-P04',
      upc:    '072655100049',
      productName: 'Healthy Choice Frozen Meals',
      brand: 'Healthy Choice',
      category: 'Frozen',
      price: { adPrice: 5.00, priceType: 'x_for_y', regularPrice: 3.29, unitCount: 2, savingsText: '2 for $5.00', priceDisplay: '2/$5.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', altText: 'Frozen meal tray' },
        lifestyle: null,
      },
      stamps: [],
      headline: 'Healthy Choice',
      description: 'Frozen entrées — selected varieties',
      disclaimer: '',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 4,
    },
    placed: {
      x: 230, y: 260, width: 225, height: 120, zIndex: 1, zoneId: 'z-healthy',
      overrides: {
        displayMode: 'combo',
      },
    },
  },

  // ── 5. Sale Band — "$3.99 Special Offer" ──────────────────────────────────
  {
    blockId: 'MW-2026-W10-BAND1',
    upc:    '000000000011',
    feedJson: {
      blockId: 'MW-2026-W10-BAND1',
      upc:    '000000000011',
      productName: '$3.99/lb Special Offer',
      category: 'Promotion',
      price: { adPrice: 3.99, priceType: 'per_lb', regularPrice: 5.49, priceDisplay: '$3.99/lb' },
      images: { product: null, lifestyle: null },
      stamps: [],
      headline: '$3.99/lb Special Offer — Bone-In Chicken Thighs',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 5,
    },
    placed: {
      x: 0, y: 385, width: 800, height: 45, zIndex: 2, zoneId: 'z-band1',
      overrides: {
        displayMode:     'sale_band',
        priceText:       '$3.99/lb Special Offer — Bone-In Chicken Thighs',
        backgroundColor: '#C8102E',
        priceFontSize:   18,
      },
    },
  },

  // ── 6. Strawberry BOGO ────────────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P06',
    upc:    '033383021002',
    feedJson: {
      blockId: 'MW-2026-W10-P06',
      upc:    '033383021002',
      productName: 'Fresh Strawberries',
      brand: 'Driscoll\'s',
      category: 'Produce',
      price: { adPrice: 1.00, priceType: 'bogo', regularPrice: 4.99, savingsText: 'Buy 1 Get 1 Free', priceDisplay: 'B1G1' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500', altText: 'Strawberries in punnet' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=700', altText: 'Bowl of fresh strawberries' },
      },
      stamps: ['BOGO'],
      headline: 'Fresh Strawberries',
      description: '16 oz. Buy 1 Get 1 Free',
      disclaimer: 'Equal or lesser value',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 6,
    },
    placed: {
      x: 0, y: 435, width: 457, height: 215, zIndex: 1, zoneId: 'z-strawberry',
      overrides: {
        displayMode:         'combo',
        activeImage:         'lifestyle',
        stamps:              ['BOGO'],
        stampPositions:      { BOGO: { x: 12, y: 15 } },
        stampSizes:          { BOGO: 60 },
        stampColors:         { BOGO: '#1B5E20' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#1B5E20',
        priceCircleBackground:'#FFFFFF',
        priceX: 80,
        priceY: 75,
        priceScale: 1.15,
      },
    },
  },

  // ── 7. Starbucks K-Cups ───────────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P07',
    upc:    '762111921015',
    feedJson: {
      blockId: 'MW-2026-W10-P07',
      upc:    '762111921015',
      productName: 'Starbucks K-Cup Pods',
      brand: 'Starbucks',
      category: 'Beverages',
      price: { adPrice: 10.99, priceType: 'each', regularPrice: 14.99, savingsText: 'Save $4.00', priceDisplay: '$10.99' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500', altText: 'Starbucks coffee cup' },
        lifestyle: null,
      },
      stamps: [],
      headline: 'Starbucks K-Cup Pods',
      description: '22-ct. Selected varieties',
      disclaimer: '',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 7,
    },
    placed: {
      x: 462, y: 435, width: 335, height: 105, zIndex: 1, zoneId: 'z-starbucks',
      overrides: {
        displayMode: 'combo',
        contentLayout: 'image-left',
      },
    },
  },

  // ── 8. BOGO Squeeze Block ─────────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-P08',
    upc:    '041190472566',
    feedJson: {
      blockId: 'MW-2026-W10-P08',
      upc:    '041190472566',
      productName: 'Meijer Pasta Sauce',
      brand: 'Meijer',
      category: 'Pantry',
      price: { adPrice: null, priceType: 'bogo', regularPrice: 2.49, savingsText: 'Buy 1 Get 1 Free', priceDisplay: 'BOGO' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', altText: 'Pasta sauce jar' },
        lifestyle: null,
      },
      stamps: ['BOGO'],
      headline: 'Meijer Pasta Sauce',
      description: '24 oz. — 3 varieties',
      disclaimer: 'Equal or lesser value',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 8,
    },
    placed: {
      x: 462, y: 545, width: 335, height: 105, zIndex: 1, zoneId: 'z-bogo',
      overrides: {
        displayMode:    'combo',
        contentLayout:  'image-left',
        stamps:         ['BOGO'],
        stampPositions: { BOGO: 'top-right' },
        stampSizes:     { BOGO: 50 },
        stampColors:    { BOGO: '#1B5E20' },
      },
    },
  },

  // ── 9. "$1 Digital Deals" Band ────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-BAND2',
    upc:    '000000000022',
    feedJson: {
      blockId: 'MW-2026-W10-BAND2',
      upc:    '000000000022',
      productName: '$1 Digital Deals',
      category: 'Promotion',
      price: { adPrice: 1.00, priceType: 'each', regularPrice: 0, priceDisplay: '$1.00' },
      images: { product: null, lifestyle: null },
      stamps: [],
      headline: '$1 Digital Deals — This Week Only!',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 9,
    },
    placed: {
      x: 0, y: 655, width: 800, height: 40, zIndex: 2, zoneId: 'z-band2',
      overrides: {
        displayMode:     'sale_band',
        priceText:       '$1 Digital Deals — This Week Only!',
        backgroundColor: '#1B5E20',
        priceFontSize:   17,
      },
    },
  },

  // ── 10. Digital Coupon — LaCroix Sparkling Water ──────────────────────────
  {
    blockId: 'MW-2026-W10-D01',
    upc:    '075520006001',
    feedJson: {
      blockId: 'MW-2026-W10-D01',
      upc:    '075520006001',
      productName: 'LaCroix Sparkling Water',
      brand: 'LaCroix',
      category: 'Beverages',
      price: { adPrice: 1.00, priceType: 'each', regularPrice: 5.49, savingsText: 'Digital Coupon Price', priceDisplay: '$1.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1606168094336-48f205bfc23a?w=400', altText: 'LaCroix cans' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=500', altText: 'Sparkling water with fruit' },
      },
      stamps: ['DIGITAL_COUPON'],
      headline: 'LaCroix Sparkling Water',
      description: '12-pk / 12 oz. cans — all flavors',
      disclaimer: 'With digital coupon',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 10,
    },
    placed: {
      x: 0, y: 698, width: 192, height: 220, zIndex: 1, zoneId: 'z-dig1',
      overrides: {
        displayMode:         'combo',
        activeImage:         'lifestyle',
        stamps:              ['DIGITAL_COUPON'],
        stampPositions:      { DIGITAL_COUPON: { x: 15, y: 18 } },
        stampSizes:          { DIGITAL_COUPON: 52 },
        stampColors:         { DIGITAL_COUPON: '#006064' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#006064',
        priceCircleBackground:'#FFFFFF',
        priceX: 80,
        priceY: 80,
        priceScale: 1.0,
      },
    },
  },

  // ── 11. Digital Coupon — Chobani Yogurt ───────────────────────────────────
  {
    blockId: 'MW-2026-W10-D02',
    upc:    '818290003817',
    feedJson: {
      blockId: 'MW-2026-W10-D02',
      upc:    '818290003817',
      productName: 'Chobani Greek Yogurt',
      brand: 'Chobani',
      category: 'Dairy',
      price: { adPrice: 1.00, priceType: 'each', regularPrice: 1.79, savingsText: 'Digital Coupon Price', priceDisplay: '$1.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', altText: 'Yogurt cup' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1571167530149-c1105da4f923?w=500', altText: 'Yogurt with granola and berries' },
      },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Chobani Greek Yogurt',
      description: '5.3 oz. — selected flavors',
      disclaimer: 'With digital coupon',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 11,
    },
    placed: {
      x: 200, y: 698, width: 192, height: 220, zIndex: 1, zoneId: 'z-dig2',
      overrides: {
        displayMode:         'combo',
        activeImage:         'lifestyle',
        stamps:              ['DIGITAL_COUPON'],
        stampPositions:      { DIGITAL_COUPON: { x: 15, y: 18 } },
        stampSizes:          { DIGITAL_COUPON: 52 },
        stampColors:         { DIGITAL_COUPON: '#006064' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#006064',
        priceCircleBackground:'#FFFFFF',
        priceX: 80,
        priceY: 80,
        priceScale: 1.0,
      },
    },
  },

  // ── 12. Digital Coupon — Sabra Hummus ─────────────────────────────────────
  {
    blockId: 'MW-2026-W10-D03',
    upc:    '040822011302',
    feedJson: {
      blockId: 'MW-2026-W10-D03',
      upc:    '040822011302',
      productName: 'Sabra Classic Hummus',
      brand: 'Sabra',
      category: 'Deli',
      price: { adPrice: 1.00, priceType: 'each', regularPrice: 4.29, savingsText: 'Digital Coupon Price', priceDisplay: '$1.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400', altText: 'Hummus with pita' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1596560548464-f010b9e43e4f?w=500', altText: 'Hummus bowl with vegetables' },
      },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Sabra Classic Hummus',
      description: '10 oz. — Original',
      disclaimer: 'With digital coupon',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 12,
    },
    placed: {
      x: 400, y: 698, width: 192, height: 220, zIndex: 1, zoneId: 'z-dig3',
      overrides: {
        displayMode:         'combo',
        activeImage:         'lifestyle',
        stamps:              ['DIGITAL_COUPON'],
        stampPositions:      { DIGITAL_COUPON: { x: 15, y: 18 } },
        stampSizes:          { DIGITAL_COUPON: 52 },
        stampColors:         { DIGITAL_COUPON: '#006064' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#006064',
        priceCircleBackground:'#FFFFFF',
        priceX: 80,
        priceY: 80,
        priceScale: 1.0,
      },
    },
  },

  // ── 13. Digital Coupon — Ritz Crackers ────────────────────────────────────
  {
    blockId: 'MW-2026-W10-D04',
    upc:    '044000041656',
    feedJson: {
      blockId: 'MW-2026-W10-D04',
      upc:    '044000041656',
      productName: 'Ritz Crackers',
      brand: 'Ritz',
      category: 'Snacks',
      price: { adPrice: 1.00, priceType: 'each', regularPrice: 4.49, savingsText: 'Digital Coupon Price', priceDisplay: '$1.00' },
      images: {
        product:   { url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', altText: 'Ritz crackers' },
        lifestyle: { url: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=500', altText: 'Crackers with cheese spread' },
      },
      stamps: ['DIGITAL_COUPON'],
      headline: 'Ritz Crackers',
      description: '13.7 oz. Family size',
      disclaimer: 'With digital coupon',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 13,
    },
    placed: {
      x: 600, y: 698, width: 192, height: 220, zIndex: 1, zoneId: 'z-dig4',
      overrides: {
        displayMode:         'combo',
        activeImage:         'lifestyle',
        stamps:              ['DIGITAL_COUPON'],
        stampPositions:      { DIGITAL_COUPON: { x: 15, y: 18 } },
        stampSizes:          { DIGITAL_COUPON: 52 },
        stampColors:         { DIGITAL_COUPON: '#006064' },
        priceCircleOverlay:  true,
        priceCircleRingColor:'#006064',
        priceCircleBackground:'#FFFFFF',
        priceX: 80,
        priceY: 80,
        priceScale: 1.0,
      },
    },
  },

  // ── 14. Footer Disclaimer ─────────────────────────────────────────────────
  {
    blockId: 'MW-2026-W10-FOOTER',
    upc:    '000000000099',
    feedJson: {
      blockId: 'MW-2026-W10-FOOTER',
      upc:    '000000000099',
      productName: 'Page Disclaimer',
      category: 'Disclaimer',
      price: { adPrice: null, priceType: 'each', regularPrice: 0, priceDisplay: '' },
      images: { product: null, lifestyle: null },
      stamps: [],
      headline: '',
      disclaimer:
        'Prices in this ad are valid March 3–9, 2026 at your local Meijer store. ' +
        'Digital coupon offers require mPerks enrollment. Limit one digital coupon per household per visit. ' +
        'Not all items available at all locations. We reserve the right to limit quantities. ' +
        'Sale prices effective through close of business on last day of sale. ' +
        'Item quantities are limited. No rainchecks. © 2026 Meijer, Inc. All rights reserved.',
      additionalText: 'mPerks required for digital deals. See meijer.com for full details.',
      locale: 'en-US', validFrom: '2026-03-03', validTo: '2026-03-09',
      regionId: 'MIDWEST', sortPriority: 99,
    },
    placed: {
      x: 0, y: 923, width: 800, height: 177, zIndex: 1, zoneId: 'z-footer',
      overrides: {
        displayMode:     'text_only',
        backgroundColor: '#F5F5F5',
        disclaimer:
          'Prices valid March 3–9, 2026. Digital coupon offers require mPerks enrollment. ' +
          'Limit one digital coupon per household per visit. ' +
          'Not all items available at all locations. We reserve the right to limit quantities. ' +
          'Sale prices effective through close of business on last day of sale. ' +
          'No rainchecks. © 2026 Meijer, Inc.',
      },
    },
  },
] as const

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🛒  Seeding Meijer weekly feature page...')

  // Verify the ad exists
  const ad = await prisma.ad.findUnique({ where: { id: AD_ID } })
  if (!ad) {
    throw new Error(
      `Ad ${AD_ID} not found.\nRun "npx prisma db seed" (seed.ts) first to create the base ad.`
    )
  }

  // 1. Upsert the custom template
  await prisma.template.upsert({
    where:  { id: TEMPLATE_ID },
    update: { layoutJson: LAYOUT as any },
    create: {
      id:          TEMPLATE_ID,
      name:        'Meijer Weekly Feature',
      category:    'promotional',
      orientation: 'portrait',
      isSystem:    false,
      layoutJson:  LAYOUT as any,
    },
  })
  console.log('  ✓ Template upserted')

  // 2. Create a new section
  const section = await prisma.section.create({
    data: {
      adId:       AD_ID,
      name:       'Weekly Deals Feature',
      position:   10,
      themeColor: '#C8102E',
    },
  })
  console.log(`  ✓ Section created: ${section.id}`)

  // 3. Create the page
  const page = await prisma.page.create({
    data: {
      sectionId:  section.id,
      templateId: TEMPLATE_ID,
      pageType:   'interior',
      position:   0,
    },
  })
  console.log(`  ✓ Page created: ${page.id}`)

  // 4. Create BlockData + PlacedBlocks
  for (const def of BLOCKS) {
    const blockData = await prisma.blockData.create({
      data: {
        blockId:  def.blockId,
        upc:      def.upc,
        feedJson: def.feedJson as any,
        regionId: 'MIDWEST',
        adId:     AD_ID,
      },
    })

    await prisma.placedBlock.create({
      data: {
        pageId:      page.id,
        blockDataId: blockData.id,
        zoneId:      def.placed.zoneId ?? null,
        x:           def.placed.x,
        y:           def.placed.y,
        width:       def.placed.width,
        height:      def.placed.height,
        zIndex:      def.placed.zIndex,
        overrides:   def.placed.overrides as any,
      },
    })

    console.log(`  ✓ ${def.feedJson.productName} placed`)
  }

  console.log('\n🎉  Done! Open the builder and navigate to the "Weekly Deals Feature" section.')
  console.log(`    Builder URL: http://localhost:3000/builder/${AD_ID}`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())

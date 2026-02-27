import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/weekly_ad_builder'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// VCS: 800 x 1100 units for portrait pages
const TEMPLATES = [
  {
    name: "Editorial Hero",
    category: "hero-feature",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "diagonal-split", x: 0, y: 0, width: 800, height: 700, colorTop: "#C8102E", colorBottom: "#FFFFFF", angle: -3, zIndex: 0 },
        { id: "bg2", type: "solid", x: 0, y: 650, width: 800, height: 450, color: "#FFFFFF", zIndex: 0 }
      ],
      zones: [
        { id: "hero", role: "hero", x: 0, y: 0, width: 800, height: 580, zIndex: 1, allowedContentTypes: ["lifestyle_image", "product_image", "combo"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "feature", role: "featured", x: 470, y: 420, width: 310, height: 380, zIndex: 3, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "support-1", role: "supporting", x: 20, y: 680, width: 240, height: 380, zIndex: 2, allowedContentTypes: ["product_image", "text_only", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "support-2", role: "supporting", x: 285, y: 700, width: 240, height: 360, zIndex: 2, allowedContentTypes: ["product_image", "text_only", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "callout", role: "callout", x: 20, y: 30, width: 220, height: 60, zIndex: 4, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: false }
      ]
    }
  },
  {
    name: "Full Bleed Feature",
    category: "full-bleed",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "full-bleed-image", x: 0, y: 0, width: 800, height: 1100, overlay: "rgba(0,0,0,0.35)", zIndex: 0 }
      ],
      zones: [
        { id: "hero", role: "hero", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, allowedContentTypes: ["lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-center", snapHint: true },
        { id: "product-1", role: "featured", x: 80, y: 700, width: 200, height: 350, zIndex: 3, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "product-2", role: "featured", x: 310, y: 680, width: 200, height: 370, zIndex: 3, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "product-3", role: "featured", x: 530, y: 710, width: 200, height: 340, zIndex: 3, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Staggered Mosaic",
    category: "editorial",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#F8F4F0", zIndex: 0 },
        { id: "accent", type: "solid", x: 0, y: 0, width: 800, height: 120, color: "#C8102E", zIndex: 0 }
      ],
      zones: [
        { id: "header-banner", role: "banner", x: 0, y: 0, width: 800, height: 120, zIndex: 2, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: true },
        { id: "large-left", role: "hero", x: 20, y: 140, width: 380, height: 420, zIndex: 1, allowedContentTypes: ["product_image", "lifestyle_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "top-right", role: "featured", x: 420, y: 140, width: 360, height: 200, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "mid-right", role: "supporting", x: 420, y: 360, width: 360, height: 200, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-left", role: "supporting", x: 20, y: 580, width: 240, height: 220, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-mid", role: "supporting", x: 280, y: 600, width: 240, height: 200, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-right", role: "supporting", x: 540, y: 580, width: 240, height: 220, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-strip", role: "accent", x: 20, y: 820, width: 760, height: 260, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Banner + Cascade",
    category: "promotional",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 },
        { id: "banner-bg", type: "solid", x: 0, y: 0, width: 800, height: 160, color: "#1B5E20", zIndex: 0 }
      ],
      zones: [
        { id: "banner", role: "banner", x: 0, y: 0, width: 800, height: 160, zIndex: 2, allowedContentTypes: ["text_only", "lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-center", snapHint: true },
        { id: "row1-1", role: "featured", x: 20, y: 180, width: 360, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "row1-2", role: "featured", x: 420, y: 180, width: 360, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "row2-1", role: "supporting", x: 20, y: 500, width: 230, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row2-2", role: "supporting", x: 285, y: 500, width: 230, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row2-3", role: "supporting", x: 550, y: 500, width: 230, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row3-1", role: "accent", x: 20, y: 800, width: 170, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "row3-2", role: "accent", x: 210, y: 800, width: 170, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "row3-3", role: "accent", x: 400, y: 800, width: 170, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "row3-4", role: "accent", x: 590, y: 800, width: 170, height: 280, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Split Half",
    category: "split",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg-left", type: "solid", x: 0, y: 0, width: 400, height: 1100, color: "#FFF3E0", zIndex: 0 },
        { id: "bg-right", type: "solid", x: 400, y: 0, width: 400, height: 1100, color: "#FFFFFF", zIndex: 0 },
        { id: "divider", type: "solid", x: 396, y: 0, width: 8, height: 1100, color: "#C8102E", zIndex: 1 }
      ],
      zones: [
        { id: "hero-left", role: "hero", x: 20, y: 80, width: 360, height: 700, zIndex: 2, allowedContentTypes: ["lifestyle_image", "product_image"], sizeVariant: "hero", textLayout: "below", snapHint: true },
        { id: "right-1", role: "featured", x: 420, y: 60, width: 360, height: 240, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "right-2", role: "supporting", x: 420, y: 320, width: 170, height: 220, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "right-3", role: "supporting", x: 610, y: 320, width: 170, height: 220, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "right-4", role: "supporting", x: 420, y: 560, width: 170, height: 220, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "right-5", role: "supporting", x: 610, y: 560, width: 170, height: 220, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-left", role: "accent", x: 20, y: 820, width: 760, height: 260, zIndex: 2, allowedContentTypes: ["product_image", "combo", "text_only"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Centered Feature",
    category: "hero-feature",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FAFAFA", zIndex: 0 },
        { id: "top-band", type: "solid", x: 0, y: 0, width: 800, height: 80, color: "#C8102E", zIndex: 0 }
      ],
      zones: [
        { id: "top-label", role: "callout", x: 0, y: 0, width: 800, height: 80, zIndex: 2, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: false },
        { id: "hero-center", role: "hero", x: 100, y: 100, width: 600, height: 560, zIndex: 1, allowedContentTypes: ["product_image", "lifestyle_image", "combo"], sizeVariant: "hero", textLayout: "below", snapHint: true },
        { id: "bottom-1", role: "supporting", x: 20, y: 700, width: 230, height: 380, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-2", role: "supporting", x: 285, y: 700, width: 230, height: 380, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-3", role: "supporting", x: 550, y: 700, width: 230, height: 380, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Corner Anchor",
    category: "editorial",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg1", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 }
      ],
      zones: [
        { id: "anchor-hero", role: "hero", x: 380, y: 520, width: 400, height: 560, zIndex: 1, allowedContentTypes: ["product_image", "lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "top-left", role: "featured", x: 20, y: 20, width: 340, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "mid-left-1", role: "supporting", x: 20, y: 320, width: 160, height: 200, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "mid-left-2", role: "supporting", x: 200, y: 320, width: 160, height: 200, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "top-right-sm", role: "supporting", x: 420, y: 20, width: 360, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-left-lg", role: "featured", x: 20, y: 540, width: 340, height: 540, zIndex: 2, allowedContentTypes: ["product_image", "lifestyle_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Wave Divider",
    category: "editorial",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "top-bg", type: "solid", x: 0, y: 0, width: 800, height: 560, color: "#E8F5E9", zIndex: 0 },
        { id: "wave", type: "wave", x: 0, y: 500, width: 800, height: 120, colorTop: "#E8F5E9", colorBottom: "#FFFFFF", zIndex: 1 },
        { id: "bottom-bg", type: "solid", x: 0, y: 580, width: 800, height: 520, color: "#FFFFFF", zIndex: 0 }
      ],
      zones: [
        { id: "hero", role: "hero", x: 40, y: 40, width: 720, height: 480, zIndex: 2, allowedContentTypes: ["lifestyle_image", "product_image", "combo"], sizeVariant: "hero", textLayout: "below", snapHint: true },
        { id: "wave-feature", role: "featured", x: 300, y: 420, width: 280, height: 300, zIndex: 4, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "bottom-1", role: "supporting", x: 20, y: 740, width: 230, height: 340, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-2", role: "supporting", x: 285, y: 760, width: 230, height: 320, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-3", role: "supporting", x: 550, y: 740, width: 230, height: 340, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Overlap Stack",
    category: "editorial",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#F5F0EB", zIndex: 0 }
      ],
      zones: [
        { id: "back", role: "hero", x: 0, y: 0, width: 800, height: 620, zIndex: 1, allowedContentTypes: ["lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "mid", role: "featured", x: 100, y: 380, width: 600, height: 460, zIndex: 3, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "front-left", role: "supporting", x: 20, y: 620, width: 260, height: 460, zIndex: 4, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "front-right", role: "supporting", x: 540, y: 640, width: 240, height: 440, zIndex: 4, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Product Showcase",
    category: "promotional",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 },
        { id: "header", type: "solid", x: 0, y: 0, width: 800, height: 100, color: "#C8102E", zIndex: 0 }
      ],
      zones: [
        { id: "header-text", role: "callout", x: 0, y: 0, width: 800, height: 100, zIndex: 2, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: false },
        { id: "p1", role: "featured", x: 20, y: 120, width: 370, height: 320, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "p2", role: "featured", x: 410, y: 120, width: 370, height: 320, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "p3", role: "supporting", x: 20, y: 460, width: 240, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "p4", role: "supporting", x: 280, y: 460, width: 240, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "p5", role: "supporting", x: 540, y: 460, width: 240, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "p6", role: "accent", x: 20, y: 780, width: 170, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "p7", role: "accent", x: 210, y: 780, width: 170, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "p8", role: "accent", x: 400, y: 780, width: 170, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true },
        { id: "p9", role: "accent", x: 590, y: 780, width: 170, height: 300, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Full Page Feature",
    category: "full-bleed",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 }
      ],
      zones: [
        { id: "full", role: "hero", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, allowedContentTypes: ["product_image", "lifestyle_image", "combo", "text_only"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true }
      ]
    }
  },
  {
    name: "Cover Page",
    category: "hero-feature",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 },
        { id: "top-bar", type: "solid", x: 0, y: 0, width: 800, height: 140, color: "#C8102E", zIndex: 0 },
        { id: "bottom-bar", type: "solid", x: 0, y: 960, width: 800, height: 140, color: "#1B5E20", zIndex: 0 }
      ],
      zones: [
        { id: "logo-area", role: "callout", x: 0, y: 0, width: 800, height: 140, zIndex: 2, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: false },
        { id: "main-hero", role: "hero", x: 40, y: 160, width: 720, height: 780, zIndex: 1, allowedContentTypes: ["lifestyle_image", "product_image", "combo"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "date-bar", role: "banner", x: 0, y: 960, width: 800, height: 140, zIndex: 2, allowedContentTypes: ["text_only"], sizeVariant: "small", textLayout: "overlay-center", snapHint: false }
      ]
    }
  },
  {
    name: "Centerfold",
    category: "hero-feature",
    orientation: "landscape",
    isSystem: true,
    layoutJson: {
      canvas: { width: 1600, height: 800 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 1600, height: 800, color: "#FAFAFA", zIndex: 0 }
      ],
      zones: [
        { id: "panoramic", role: "hero", x: 0, y: 0, width: 1600, height: 480, zIndex: 1, allowedContentTypes: ["lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "cf-1", role: "supporting", x: 20, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "cf-2", role: "supporting", x: 285, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "cf-3", role: "supporting", x: 550, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "cf-4", role: "supporting", x: 815, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "cf-5", role: "supporting", x: 1080, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "cf-6", role: "supporting", x: 1340, y: 500, width: 240, height: 280, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Accent Strip",
    category: "promotional",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg", type: "solid", x: 0, y: 0, width: 800, height: 1100, color: "#FFFFFF", zIndex: 0 },
        { id: "strip", type: "solid", x: 0, y: 160, width: 800, height: 30, color: "#C8102E", zIndex: 1 }
      ],
      zones: [
        { id: "hero", role: "hero", x: 20, y: 20, width: 760, height: 140, zIndex: 2, allowedContentTypes: ["text_only", "lifestyle_image"], sizeVariant: "hero", textLayout: "overlay-center", snapHint: true },
        { id: "row1-1", role: "featured", x: 20, y: 210, width: 360, height: 420, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "row1-2", role: "featured", x: 420, y: 210, width: 360, height: 420, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "row2-1", role: "supporting", x: 20, y: 650, width: 170, height: 430, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row2-2", role: "supporting", x: 210, y: 650, width: 170, height: 430, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row2-3", role: "supporting", x: 400, y: 650, width: 170, height: 430, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "row2-4", role: "supporting", x: 590, y: 650, width: 170, height: 430, zIndex: 1, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true }
      ]
    }
  },
  {
    name: "Diagonal Feature",
    category: "split",
    orientation: "portrait",
    isSystem: true,
    layoutJson: {
      canvas: { width: 800, height: 1100 },
      backgroundLayers: [
        { id: "bg-top", type: "solid", x: 0, y: 0, width: 800, height: 700, color: "#C8102E", zIndex: 0 },
        { id: "diagonal", type: "diagonal-split", x: 0, y: 560, width: 800, height: 160, colorTop: "#C8102E", colorBottom: "#FFFFFF", angle: -5, zIndex: 1 },
        { id: "bg-bottom", type: "solid", x: 0, y: 680, width: 800, height: 420, color: "#FFFFFF", zIndex: 0 }
      ],
      zones: [
        { id: "hero", role: "hero", x: 20, y: 40, width: 760, height: 560, zIndex: 2, allowedContentTypes: ["lifestyle_image", "product_image", "combo"], sizeVariant: "hero", textLayout: "overlay-bottom", snapHint: true },
        { id: "diagonal-feature", role: "featured", x: 480, y: 440, width: 300, height: 380, zIndex: 4, allowedContentTypes: ["product_image", "combo"], sizeVariant: "large", textLayout: "below", snapHint: true },
        { id: "bottom-1", role: "supporting", x: 20, y: 740, width: 230, height: 340, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "medium", textLayout: "below", snapHint: true },
        { id: "bottom-2", role: "supporting", x: 285, y: 740, width: 170, height: 340, zIndex: 2, allowedContentTypes: ["product_image", "combo"], sizeVariant: "small", textLayout: "below", snapHint: true }
      ]
    }
  }
]

async function main() {
  console.log('Seeding templates...')

  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@meijer.com' },
    update: {},
    create: {
      email: 'admin@meijer.com',
      name: 'Admin User',
      role: 'admin'
    }
  })

  const designer = await prisma.user.upsert({
    where: { email: 'designer@meijer.com' },
    update: {},
    create: {
      email: 'designer@meijer.com',
      name: 'Jane Designer',
      role: 'designer'
    }
  })

  const approver = await prisma.user.upsert({
    where: { email: 'approver@meijer.com' },
    update: {},
    create: {
      email: 'approver@meijer.com',
      name: 'Bob Approver',
      role: 'approver'
    }
  })

  for (const template of TEMPLATES) {
    await prisma.template.upsert({
      where: { id: template.name },
      update: { layoutJson: template.layoutJson as any },
      create: {
        id: template.name,
        ...template,
        layoutJson: template.layoutJson as any
      }
    })
  }

  console.log('Seeding sample ad...')

  // Create a sample ad — fixed ID so seed-meijer-sample.ts can reference it
  const sampleAd = await prisma.ad.upsert({
    where: { id: 'dd217886-ffdc-41ad-9b0b-ac95dee77fb9' },
    update: {},
    create: {
      id: 'dd217886-ffdc-41ad-9b0b-ac95dee77fb9',
      name: 'Week of Mar 3-9, 2026',
      regionIds: ['WEST_COAST', 'MIDWEST'],
      validFrom: new Date('2026-03-03'),
      validTo: new Date('2026-03-09'),
      status: 'draft',
      createdById: designer.id,
    }
  })

  // Create sample sections
  const produceSection = await prisma.section.create({
    data: {
      adId: sampleAd.id,
      name: 'Produce',
      position: 0,
      themeColor: '#1B5E20'
    }
  })

  await prisma.page.create({
    data: {
      sectionId: produceSection.id,
      templateId: 'Editorial Hero',
      pageType: 'interior',
      position: 0
    }
  })

  const meatSection = await prisma.section.create({
    data: {
      adId: sampleAd.id,
      name: 'Meat & Seafood',
      position: 1,
      themeColor: '#B71C1C'
    }
  })

  await prisma.page.create({
    data: {
      sectionId: meatSection.id,
      templateId: 'Banner + Cascade',
      pageType: 'interior',
      position: 0
    }
  })

  // Import sample block data
  const sampleBlocks = [
    {
      blockId: 'BLK-2026-W10-001',
      upc: '012345678901',
      feedJson: {
        blockId: 'BLK-2026-W10-001',
        upc: '012345678901',
        productName: 'Organic Fuji Apples',
        brand: "Nature's Best",
        category: 'Produce',
        price: {
          adPrice: 3.99,
          priceType: 'per_lb',
          regularPrice: 5.49,
          savingsText: 'Save $1.50/lb',
          priceDisplay: '$3.99/lb'
        },
        images: {
          product: { url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', altText: 'Fuji Apples' },
          lifestyle: { url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800', altText: 'Apple arrangement' }
        },
        stamps: ['SALE'],
        headline: 'Organic Fuji Apples',
        description: 'Crisp, sweet, and locally grown',
        disclaimer: 'While supplies last',
        locale: 'en-US',
        validFrom: '2026-03-03',
        validTo: '2026-03-09',
        regionId: 'WEST_COAST',
        sortPriority: 1
      }
    },
    {
      blockId: 'BLK-2026-W10-002',
      upc: '023456789012',
      feedJson: {
        blockId: 'BLK-2026-W10-002',
        upc: '023456789012',
        productName: 'Boneless Chicken Breast',
        brand: 'Farm Fresh',
        category: 'Meat & Poultry',
        price: {
          adPrice: 4.99,
          priceType: 'per_lb',
          regularPrice: 7.49,
          savingsText: 'Save $2.50/lb',
          priceDisplay: '$4.99/lb'
        },
        images: {
          product: { url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400', altText: 'Chicken Breast' },
          lifestyle: { url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=800', altText: 'Grilled chicken dinner' }
        },
        stamps: ['HOT_DEAL'],
        headline: 'Boneless Chicken Breast',
        description: 'Fresh, never frozen',
        disclaimer: 'Limit 2 per customer',
        locale: 'en-US',
        validFrom: '2026-03-03',
        validTo: '2026-03-09',
        regionId: 'WEST_COAST',
        sortPriority: 2
      }
    },
    {
      blockId: 'BLK-2026-W10-003',
      upc: '034567890123',
      feedJson: {
        blockId: 'BLK-2026-W10-003',
        upc: '034567890123',
        productName: 'Fresh Broccoli Crown',
        brand: 'Organic Valley',
        category: 'Produce',
        price: {
          adPrice: 1.49,
          priceType: 'each',
          regularPrice: 2.29,
          savingsText: 'Save $0.80',
          priceDisplay: '$1.49'
        },
        images: {
          product: { url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400', altText: 'Broccoli Crown' },
          lifestyle: null
        },
        stamps: ['ORGANIC'],
        headline: 'Fresh Broccoli Crown',
        description: 'Organic, farm to table',
        disclaimer: '',
        locale: 'en-US',
        validFrom: '2026-03-03',
        validTo: '2026-03-09',
        regionId: 'WEST_COAST',
        sortPriority: 3
      }
    },
    {
      blockId: 'BLK-2026-W10-004',
      upc: '045678901234',
      feedJson: {
        blockId: 'BLK-2026-W10-004',
        upc: '045678901234',
        productName: 'Artisan Sourdough Bread',
        brand: 'Stone Mill',
        category: 'Bakery',
        price: {
          adPrice: null,
          priceType: 'bogo',
          regularPrice: 5.99,
          savingsText: 'Buy 1, Get 1 Free',
          priceDisplay: 'BOGO'
        },
        images: {
          product: { url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400', altText: 'Sourdough Bread' },
          lifestyle: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', altText: 'Bread spread' }
        },
        stamps: ['BOGO'],
        headline: 'Artisan Sourdough Bread',
        description: 'Baked fresh daily',
        disclaimer: 'Equal or lesser value',
        locale: 'en-US',
        validFrom: '2026-03-03',
        validTo: '2026-03-09',
        regionId: 'WEST_COAST',
        sortPriority: 4
      }
    },
    {
      blockId: 'BLK-2026-W10-005',
      upc: '056789012345',
      feedJson: {
        blockId: 'BLK-2026-W10-005',
        upc: '056789012345',
        productName: 'Atlantic Salmon Fillet',
        brand: 'Ocean Select',
        category: 'Seafood',
        price: {
          adPrice: 9.99,
          priceType: 'per_lb',
          regularPrice: 13.99,
          savingsText: 'Save $4.00/lb',
          priceDisplay: '$9.99/lb'
        },
        images: {
          product: { url: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400', altText: 'Salmon Fillet' },
          lifestyle: { url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800', altText: 'Salmon dish' }
        },
        stamps: ['HOT_DEAL'],
        headline: 'Atlantic Salmon Fillet',
        description: 'Wild-caught, sushi grade',
        disclaimer: '',
        locale: 'en-US',
        validFrom: '2026-03-03',
        validTo: '2026-03-09',
        regionId: 'WEST_COAST',
        sortPriority: 5
      }
    }
  ]

  for (const block of sampleBlocks) {
    await prisma.blockData.create({
      data: {
        blockId: block.blockId,
        upc: block.upc,
        feedJson: block.feedJson as any,
        regionId: 'WEST_COAST',
        adId: sampleAd.id
      }
    })
  }

  console.log('Seed complete!')
  console.log('Users:', { admin: admin.email, designer: designer.email, approver: approver.email })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

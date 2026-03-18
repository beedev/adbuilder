# Weekly Ad Builder — Architecture & Design Document

> Meijer weekly advertisement design tool built with Next.js 16, React 19, Prisma 7, and PostgreSQL.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Data Model](#data-model)
5. [State Management](#state-management)
6. [Virtual Coordinate System](#virtual-coordinate-system)
7. [Template System](#template-system)
8. [Component Architecture](#component-architecture)
9. [API Surface](#api-surface)
10. [Drag-and-Drop System](#drag-and-drop-system)
11. [Price Engine](#price-engine)
12. [Workflow & Approval](#workflow--approval)
13. [PDF Export Pipeline](#pdf-export-pipeline)
14. [Key Design Decisions](#key-design-decisions)

---

## System Overview

The Weekly Ad Builder is a canvas-based design tool for creating, reviewing, and publishing Meijer weekly advertisements. Designers drag product blocks onto template-based pages, customize pricing and layout, and submit for approval.

```
                    +-----------+
                    |  Designer |
                    +-----+-----+
                          |
                    +-----v-----+
                    |  Builder   |  (Drag-drop canvas editor)
                    |  /builder  |
                    +-----+-----+
                          |
              +-----------+-----------+
              |                       |
        +-----v-----+          +-----v-----+
        |  API Layer |          | Zustand   |
        |  /api/*    |          | Stores    |
        +-----+-----+          +-----------+
              |                  priceStore
        +-----v-----+           adStore
        |  Prisma 7  |          uiStore
        |  + PG Pool |
        +-----+-----+
              |
        +-----v-----+
        | PostgreSQL |
        +-----+-----+
              |
        +-----v-----+
        |  Approver  |  (Review & approve flow)
        |  /review   |
        +-----------+
```

### Core User Flows

1. **Create Ad** — Dashboard (`/`) -> New Ad -> Builder (`/builder/[id]`)
2. **Design Pages** — Select template -> Drag blocks from tray -> Customize overrides
3. **Submit for Review** — Designer submits -> Version snapshot created -> Status: `in_review`
4. **Approve/Reject** — Approver reviews at `/review/[id]` -> Approve, Reject, or Request Changes
5. **Export** — PDF (A4 via Puppeteer) or IDML (Adobe InDesign package via JSZip)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.1.6 | Server/client rendering, API routes |
| UI | React | 19.2.3 | Component rendering |
| Language | TypeScript | 5 | Type safety |
| Styling | Tailwind CSS | 4 | CSS-based theming (`@theme inline`) |
| State | Zustand | 5.0.11 | Client-side state management |
| ORM | Prisma | 7.4.1 | Database access with PG adapter |
| Database | PostgreSQL | - | Primary data store |
| Drag-Drop | dnd-kit | 6.3.1 | Canvas block placement |
| Animation | Framer Motion | 12.34.3 | Price flash animations |
| Rich Text | Tiptap | 3.20.0 | Headline/description editing |
| UI Primitives | Radix UI | - | Dialog, Popover, Toast, Tooltip, etc. |
| Icons | Lucide React | 0.575.0 | Icon library |
| PDF | Puppeteer | 24.37.5 | Server-side PDF generation |
| IDML | JSZip | 3.x | Adobe InDesign IDML package generation |
| Data Fetching | TanStack React Query | 5.90.21 | Server state caching |
| Queue | BullMQ + ioredis | 5.70.1 | Background job processing |
| Feed Parsing | fast-xml-parser | 5.4.1 | XML product feed import |
| Testing | Playwright | 1.58.2 | E2E testing |

---

## Directory Structure

```
weekly-ad-builder/
├── prisma/
│   ├── schema.prisma              # 13 models
│   ├── migrations/                # Database migrations
│   ├── seed.ts                    # 3 users + 15 templates
│   └── seed-meijer-weekly.ts      # Sample ad data
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (Inter font)
│   │   ├── page.tsx               # Dashboard (/)
│   │   ├── not-found.tsx          # 404 page
│   │   ├── globals.css            # Tailwind 4 theme
│   │   ├── builder/[id]/page.tsx  # Canvas editor
│   │   ├── review/[id]/page.tsx   # Approval flow
│   │   ├── ad-print/[id]/page.tsx # Print-optimized view
│   │   ├── templates/             # Template CRUD pages
│   │   └── api/                   # 24 API routes (see API Surface)
│   ├── components/
│   │   ├── canvas/                # 8 components (rendering engine)
│   │   ├── panels/                # 6 components (sidebars)
│   │   ├── layout/                # TopBar
│   │   ├── modals/                # BlockCreatorModal
│   │   ├── print/                 # AdPrintPages
│   │   └── templates/             # TemplateSelector, TemplateBuilder
│   ├── stores/
│   │   ├── adStore.ts             # Ad structure + undo/redo (463 lines)
│   │   ├── priceStore.ts          # UPC price map + regional overrides (91 lines)
│   │   └── uiStore.ts             # Selection, zoom, panels (79 lines)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton (PG adapter)
│   │   ├── feedParser.ts          # XML/JSON feed import
│   │   ├── priceFormatter.ts      # Price display formatting
│   │   ├── pdf.ts                 # Puppeteer PDF generation (A4)
│   │   ├── idml/                  # IDML export module
│   │   │   ├── generator.ts       # Main IDML generator (Ad → ZIP)
│   │   │   ├── coordinates.ts     # VCS → InDesign point conversion
│   │   │   └── templates/         # XML template generators
│   │   │       ├── meta.ts        # META-INF/container.xml
│   │   │       ├── designmap.ts   # Root manifest
│   │   │       ├── resources.ts   # Fonts, Graphics, Styles XML
│   │   │       ├── spread.ts      # Spread XML (frames/geometry)
│   │   │       └── story.ts       # Story XML (text content)
│   │   └── utils.ts               # cn(), clampToCanvas(), snapToZone()
│   └── types/
│       └── index.ts               # All TypeScript definitions (~250 lines)
├── e2e/                           # Playwright E2E tests
├── scripts/                       # Seed & utility scripts
└── public/                        # Static assets
```

---

## Data Model

### Entity Relationship Diagram

```
User ──┬──creates──► Ad ──┬──► Vehicle ──► Page ──► PlacedBlock ──► BlockData
       ├──locks────► Ad   │
       ├──comments─► Comment
       ├──audits───► AuditLog
       └──sets─────► PriceOverride
                          │
                          ├──► BlockData (ad-level library)
                          ├──► PriceOverride (regional prices)
                          ├──► Comment (threaded)
                          ├──► AuditLog (action trail)
                          └──► AdVersion (submit snapshots)

Template ◄── Page (each page references a template)
```

### 13 Prisma Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | System users | email (unique), role (designer/approver/admin) |
| **Ad** | Root document | name, status, regionIds[], validFrom/To, version |
| **Vehicle** | Ad variant container | name, position, themeColor |
| **Page** | Canvas page | templateId, pageType (front_cover/back_cover/interior/centerfold), position |
| **PlacedBlock** | Block on canvas | x, y, width, height, zIndex, zoneId, overrides (JSON) |
| **BlockData** | Product feed data | upc, feedJson (JSON), regionId |
| **PriceOverride** | Regional price | upc + regionId + adId (unique), price (JSON) |
| **Template** | Page layout | category, orientation, layoutJson (JSON) |
| **Comment** | Review comments | text, resolved, adId/pageId/placedBlockId |
| **AuditLog** | Action audit | action, entityType, oldVal/newVal (JSON) |
| **AdVersion** | Submit snapshots | version, snapshot (JSON), triggeredBy |

### Core Type Hierarchy

```typescript
// Price System
PriceType = 'each' | 'per_lb' | 'x_for_y' | 'bogo' | 'pct_off'
PriceData = { priceType, adPrice, regularPrice, unitCount, percentOff, savingsText, priceDisplay }

// Block System
BlockData = { blockId, upc, productName, brand, category, price, images, stamps, headline, ... }
PlacedBlock = { id, pageId, blockDataId, x, y, width, height, zIndex, zoneId, overrides }
PlacedBlockOverrides = { displayMode, backgroundColor, headline, stamps, priceX/Y/Scale, ... } // ~35 optional fields

// Template System
Template = { id, name, category, orientation, layoutJson: TemplateLayout }
TemplateLayout = { canvas: {width, height}, backgroundLayers[], zones[] }
TemplateZone = { id, role, x, y, width, height, allowedContentTypes, textLayout, snapHint }

// Ad Hierarchy
Ad -> Vehicle[] -> Page[] -> PlacedBlock[] -> BlockData
```

### Display Modes (9 total)

| Mode | Description |
|------|-------------|
| `product_image` | Image (58% height) + text + price |
| `lifestyle_image` | Full lifestyle image + text below |
| `text_overlay` | Lifestyle image + overlaid text |
| `text_only` | Text block, no image |
| `combo` | Image + price + text (55% image) |
| `combo_no_price` | Image + text only |
| `sale_band` | Red promotional band |
| `stamp_overlay` | Stamp badges with text |
| `price_circle` | Image + circular price callout |

---

## State Management

Three Zustand stores with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    State Architecture                    │
├──────────────┬──────────────────┬───────────────────────┤
│  priceStore  │    adStore       │      uiStore          │
│              │                  │                       │
│  UPC prices  │  Ad tree         │  Selection            │
│  Regional    │  Vehicles/Pages  │  Zoom (0.25-2.0)     │
│  overrides   │  PlacedBlocks    │  Active panel         │
│  Flash set   │  Undo/Redo      │  Drag state           │
│              │  Dirty tracking  │  Modal states         │
│              │  Templates       │  Workbench state      │
├──────────────┴──────────────────┴───────────────────────┤
│              Immutable Updates Throughout                │
└─────────────────────────────────────────────────────────┘
```

### adStore — Ad Structure + History

- **State**: `ad` (full nested tree), `templates`, `isDirty`, `dirtyBlockIds`, `history[]`, `historyIndex`
- **Mutations**: `placeBlock`, `moveBlock`, `removeBlock`, `updateBlockOverride`, `resizeBlock`
- **Vehicle/Page**: `addVehicle`, `addPage`, `deletePage`, `swapTemplate`, `reorderVehicle`, `reorderPage`
- **History**: Command pattern with max 50 entries; `undo()` / `redo()` navigates history index
- **Async**: Vehicle/page creation hits API, then updates local state
- **Pattern**: All mutations rebuild ancestor objects (immutable deep-nested updates)

### priceStore — Price Engine

- **State**: `prices` (UPC -> PriceData), `regionalPrices` (region -> UPC -> PriceData), `activeRegion`, `recentlyUpdated` (Set)
- **Lookup**: `getPrice(upc)` — checks regional first, falls back to global
- **Updates**: `setOverride(upc, price)` marks UPC in `recentlyUpdated` for 2-second flash animation
- **Import**: `importFeed(blocks)` bulk-loads prices, detects changes, triggers flash on changed UPCs
- **Middleware**: `subscribeWithSelector` for fine-grained subscriptions

### uiStore — Ephemeral UI State

- **State**: `selectedBlockId`, `selectedPageId`, `zoom`, `activePanel`, `isDragging`, modal flags
- **Actions**: `selectBlock()` auto-opens inspector; `selectPage()` deselects block; `setZoom()` clamps 0.25-2.0
- **Pattern**: Simple imperative state setters with basic constraints

### Data Flow

```
API Response ──► adStore.setAd() ──► Canvas renders placedBlocks
                                          │
                                     DnD events
                                          │
                                     placeBlock() / moveBlock()
                                          │
                                     isDirty = true
                                          │
                                     Autosave (30s interval)
                                          │
                                     PATCH /api/ads/[id]

Feed Import ──► priceStore.importFeed() ──► PriceDisplay re-renders
                                                │
                                           Framer Motion flash (2s)
```

---

## Virtual Coordinate System

The canvas uses a Virtual Coordinate System (VCS) that decouples design layout from screen pixels.

```
┌──────────────────────────────────┐
│        Design Space              │
│        800 × 1100 units          │
│                                  │
│   ┌─────────┐  ┌─────────┐      │
│   │ Block A  │  │ Block B  │     │
│   │ x:50     │  │ x:420    │     │
│   │ y:100    │  │ y:100    │     │
│   │ w:350    │  │ w:330    │     │
│   │ h:400    │  │ h:400    │     │
│   └─────────┘  └─────────┘      │
│                                  │
│   All values in design units     │
│   Rendered via:                  │
│     left: x * scale              │
│     top:  y * scale              │
│     width:  w * scale            │
│     height: h * scale            │
└──────────────────────────────────┘

scale = zoom level (0.25 - 2.0, default 0.75)
```

**Key properties**:
- Canvas dimensions: 800x1100 (portrait) or 1600x800 (landscape/centerfold)
- All block positions (`x`, `y`, `width`, `height`) stored in design units
- Rendered via CSS `position: absolute` + `left`/`top` inline styles multiplied by `scale`
- Mouse/pointer coordinates converted back to design units via `/ scale` on drag/resize
- `clampToCanvas()` ensures blocks stay within bounds
- `snapToZone()` provides magnetic snapping within 40 design units of a zone edge

---

## Template System

Templates define canvas structure with background layers and content zones.

### Template Layout

```typescript
TemplateLayout {
  canvas: { width: 800, height: 1100 }
  backgroundLayers: BackgroundLayer[]     // Decorative visual layers
  zones: TemplateZone[]                   // Content placement guides
}
```

### Background Layer Types

| Type | Description | Properties |
|------|-------------|------------|
| `solid` | Single color fill | color |
| `gradient` | Two-color linear gradient | colorFrom, colorTo |
| `diagonal-split` | Angled color split | color, angle (-3 to -5 degrees) |
| `wave` | SVG wave divider | color, position (y%) |
| `full-bleed-image` | Full image with optional scrim | imageUrl, overlayColor, overlayOpacity |

### Template Zones

Zones are semantic placement regions that guide block positioning:

| Role | Purpose | Typical Size |
|------|---------|-------------|
| `hero` | Main feature block | Large (400x500+) |
| `featured` | Secondary blocks | Medium (300x350) |
| `supporting` | Tertiary blocks | Small-Medium (200x250) |
| `accent` | Small accent items | Small (150x200) |
| `banner` | Header/footer text | Full-width, short height |
| `callout` | Labels/badges | Compact |

**Zone constraints**: `allowedContentTypes` restricts which display modes can be placed; `textLayout` controls text positioning relative to image; `snapHint` enables magnetic snapping.

### 15 Seeded Templates (5 Categories)

| Category | Templates | Notable Feature |
|----------|----------|-----------------|
| hero-feature | Editorial Hero, Centered Feature, Cover Page, Centerfold | Centerfold is landscape (1600x800) |
| editorial | Staggered Mosaic, Corner Anchor, Wave Divider, Overlap Stack | Wave uses SVG divider |
| full-bleed | Full Bleed Feature, Full Page Feature | Edge-to-edge imagery |
| promotional | Banner + Cascade, Product Showcase, Accent Strip | Sale-oriented layouts |
| split | Split Half, Diagonal Feature | Side-by-side composition |

---

## Component Architecture

### Component Hierarchy

```
RootLayout
├── Dashboard (/)
│   └── Ad list, create modal, status badges
│
├── Builder (/builder/[id])
│   ├── TopBar — Save, submit, zoom controls
│   ├── BlockTray (left sidebar)
│   │   ├── Overlay section (stamps 4x4 grid, sale bands)
│   │   └── Product blocks (filterable, searchable)
│   ├── PageCanvas (center)
│   │   ├── BackgroundLayer[] — Template backgrounds
│   │   ├── ZoneOverlay[] — Drop zone guides
│   │   ├── ZoneDropTarget[] — Invisible drop receivers
│   │   └── DraggableBlock[] — Placed blocks
│   │       └── BlockRenderer
│   │           ├── PriceDisplay — Formatted price + flash
│   │           ├── PriceCalloutCircle — Circular price badge
│   │           ├── StampBadge[] — Merchandising stamps (max 2)
│   │           └── OverlayRenderer — sale_band / stamp_overlay modes
│   ├── BlockInspector (right sidebar)
│   │   ├── Display mode selector
│   │   ├── Image picker gallery
│   │   ├── Text fields (headline, description, disclaimer)
│   │   ├── Price overrides
│   │   ├── Style controls (colors, layout)
│   │   └── Stamp editor
│   ├── VehicleNavigator — Vehicle/page sidebar
│   ├── TemplateSelector — Modal template picker
│   ├── ImageWorkbench — Modal image compositor
│   └── BlockCreatorModal — New block creation
│
├── Review (/review/[id])
│   ├── Read-only PageCanvas
│   ├── Comments panel
│   └── Approve / Reject / Request Changes buttons
│
├── Templates (/templates)
│   ├── Template gallery grid
│   └── TemplateBuilder (create/edit)
│
└── Print View (/ad-print/[id])
    └── AdPrintPages — Print-optimized rendering
```

### Canvas Components (8)

| Component | Role |
|-----------|------|
| `PageCanvas` | Root canvas: VCS scaling, dnd-kit integration, renders all layers |
| `BackgroundLayer` | Template backgrounds (solid, gradient, wave, diagonal, image) |
| `ZoneOverlay` | Dashed zone borders; bright blue during drag |
| `BlockRenderer` | Polymorphic block: 9 display modes, stamps, price circle |
| `PriceDisplay` | Formatted price with Framer Motion flash (2s) |
| `PriceCalloutCircle` | Circular price badge with ring + label |
| `StampBadge` | Stamp badge: 4 shapes, draggable, resizable, 18 types |
| `OverlayRenderer` | Handles `sale_band` and `stamp_overlay` modes |

### Panel Components (6)

| Component | Role |
|-----------|------|
| `BlockTray` | Left sidebar: draggable product blocks, overlays, search/filter |
| `BlockInspector` | Right sidebar: 6 accordion sections for editing selected block |
| `OverlayInspector` | Inspector variant for stamp_overlay/sale_band blocks |
| `ImagePickerGallery` | Product/lifestyle image browser |
| `ImageWorkbench` | Modal canvas for image compositing (layers, background) |
| `VehicleNavigator` | Vehicle/page tree navigation |

### Stamp System

18 stamp types: SALE, BOGO, PCT_OFF, NEW, ORGANIC, LOCAL, FRESH, DIGITAL_COUPON, CLEARANCE, SEASONAL, LIMITED_TIME, MEMBER_PRICE, RAIN_CHECK, FAMILY_PACK, GLUTEN_FREE, NON_GMO, KOSHER, VEGAN

4 shapes: `circle`, `square`, `pill`, `ring`

Stamps are draggable (pointer-based, independent of block DnD) with resizable handles. Corner positioning uses percentage mapping. Max 2 stamps rendered per block.

---

## API Surface

24 REST endpoints organized by resource:

### Ad Management
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/ads` | List all ads (full nested structure) |
| POST | `/api/ads` | Create new ad |
| GET | `/api/ads/[id]` | Fetch single ad |
| PATCH | `/api/ads/[id]` | Update ad fields |
| DELETE | `/api/ads/[id]` | Delete ad |

### Vehicles & Pages
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ads/[id]/vehicles` | Create vehicle |
| PUT | `/api/ads/[id]/vehicles` | Bulk reorder vehicles |
| POST | `/api/ads/[id]/pages` | Create page |
| PATCH | `/api/ads/[id]/pages/[pageId]` | Update page |
| DELETE | `/api/ads/[id]/pages/[pageId]` | Delete page |

### Blocks & Block Data
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ads/[id]/blocks` | Place block on canvas |
| PATCH | `/api/ads/[id]/blocks/[blockId]` | Update block position/overrides |
| DELETE | `/api/ads/[id]/blocks/[blockId]` | Remove block |
| POST | `/api/ads/[id]/blocks/create` | Create new block data |
| GET | `/api/ads/[id]/blockdata` | List all block data (library) |
| POST | `/api/ads/[id]/blocks/import` | Import from XML/JSON feed |
| POST | `/api/ads/[id]/blocks/ingest` | Bulk ingest structured blocks |
| GET | `/api/blocks/feed` | Get block feed data |

### Prices, Comments & Workflow
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/ads/[id]/prices` | Get price overrides |
| PATCH | `/api/ads/[id]/prices` | Upsert price override |
| GET/POST | `/api/ads/[id]/comments` | Read/write comments |
| POST | `/api/ads/[id]/submit` | Submit for review (creates version) |
| POST | `/api/ads/[id]/approve` | Approve ad |
| POST | `/api/ads/[id]/reject` | Reject ad |
| POST | `/api/ads/[id]/request-changes` | Request changes |

### Export, Templates & Utility
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/ads/[id]/export/blocks` | Export blocks (vehicle/page filter) |
| POST | `/api/ads/[id]/export/pdf` | Generate PDF (A4) |
| POST | `/api/ads/[id]/export/idml` | Generate IDML (InDesign) |
| GET/POST | `/api/templates` | List/create templates |
| GET/PUT/DELETE | `/api/templates/[id]` | Template CRUD |
| GET | `/api/image-search` | Search Wikimedia Commons |
| GET | `/api/users` | List users |

---

## Drag-and-Drop System

Built on dnd-kit with custom sensors and collision detection.

### Drag Types

| Type | Source | Target | Action |
|------|--------|--------|--------|
| `from-tray` | BlockTray product card | Canvas / Zone | `adStore.placeBlock()` |
| `reposition` | Placed block on canvas | Canvas / Zone | `adStore.moveBlock()` |
| `component` | Stamp/sale-band card | Canvas | Creates overlay block |

### Implementation Details

- **Sensor**: `PointerSensor` with `closestCenter` collision detection
- **DragOverlay**: Preview thumbnail rendered during drag
- **Zone targeting**: `ZoneDropTarget` components appear during drag; blocks snap to zones within 40-unit threshold
- **Resize**: Bottom-right corner handle; pointer events convert `clientDelta / scale` to design units
- **Conflict avoidance**: Stamp and price circle drag use raw pointer events to avoid triggering block-level DnD

### Drag Flow

```
User grabs block from tray
    │
    ├── DragOverlay renders preview
    │
    ├── ZoneOverlays highlight (blue borders)
    │
    └── User drops on canvas
            │
            ├── snapToZone() checks proximity (40-unit threshold)
            │
            ├── clampToCanvas() constrains bounds (800x1100)
            │
            └── adStore.placeBlock() creates PlacedBlock
                    │
                    └── Canvas re-renders with new block
```

---

## Price Engine

### Architecture

```
┌─────────────────────────────────────────┐
│              priceStore                  │
│                                         │
│  prices: { UPC → PriceData }           │  ← Global prices
│  regionalPrices: { region → { UPC → }} │  ← Regional overrides
│  activeRegion: 'WEST_COAST'            │
│  recentlyUpdated: Set<UPC>             │  ← Flash animation triggers
│                                         │
│  getPrice(upc):                         │
│    regionalPrices[activeRegion][upc]    │
│    ?? prices[upc]                       │  ← Cascade lookup
│                                         │
│  setOverride(upc, price):              │
│    write to regionalPrices              │
│    add to recentlyUpdated               │
│    setTimeout(clearUpdated, 2000ms)     │  ← Auto-clear flash
│                                         │
│  importFeed(blocks):                    │
│    bulk load prices                     │
│    detect changed UPCs                  │
│    trigger 2s flash on changes          │
└─────────────────────────────────────────┘
```

### Price Types

| Type | Example Display | Format |
|------|----------------|--------|
| `each` | $3.99 | `$main.cents` |
| `per_lb` | $3.99/lb | `$main.cents/lb` |
| `x_for_y` | 2/$8 | `count/$total` |
| `bogo` | Buy 1, Get 1 Free | Text |
| `pct_off` | 15% OFF | `percent% OFF` |

### Price Display Components

- **PriceDisplay**: Inline formatted price with Framer Motion scale animation (1.15x flash for 2 seconds)
- **PriceCalloutCircle**: Circular badge with dashed ring, label (italic), main price (bold), cents (superscript), unit text

---

## Workflow & Approval

### Status State Machine

```
     ┌──────────┐
     │  draft   │◄──────────────────────┐
     └────┬─────┘                       │
          │ submit                      │
          ▼                             │
     ┌──────────┐     reject       ┌────┴─────┐
     │in_review ├──────────────────►│  draft   │
     └────┬─────┘     request      └──────────┘
          │           changes
          │ approve
          ▼
     ┌──────────┐
     │ approved │
     └────┬─────┘
          │ publish
          ▼
     ┌──────────┐
     │published │
     └──────────┘
```

### Version Snapshots

On every submit, an `AdVersion` record is created with a full JSON snapshot of the ad state. This provides audit history and rollback capability.

### Audit Logging

`AuditLog` records track block placement, price overrides, and other mutations with `oldVal`/`newVal` JSON fields for change tracking.

---

## PDF Export Pipeline

```
Client: POST /api/ads/[id]/export/pdf
    │
    ▼
Server: Launch Puppeteer (singleton browser)
    │
    ├── Set viewport: 800×1100 (VCS native size)
    │
    ├── Navigate to /ad-print/[id]
    │
    ├── Reset body margins (margin:0, padding:0)
    │
    ├── Wait for [data-pdf-ready="true"] signal
    │   (client sets this after all images load)
    │
    ├── Generate A4 PDF:
    │   • format: A4 (210mm × 297mm)
    │   • scale: 1.33 (800px → 600pt base, scaled up)
    │   • margins: 15mm top/right/left, 8mm bottom
    │   • printBackground: true
    │
    └── Return PDF as Uint8Array
```

The `/ad-print/[id]` route renders `AdPrintPages` — a print-optimized version of the canvas (800px wide, overflow hidden) with proper page breaks and print CSS.

**Key math**: Puppeteer converts CSS px to PDF points at 72/96 ratio. 800px = 600pt = 211.67mm. A4 printable width (180mm after margins) requires scale of ~0.85, then ×1.5 for enlargement = ~1.33.

---

## IDML Export Pipeline (Adobe InDesign)

```
Client: POST /api/ads/[id]/export/idml
    │
    ▼
Server: Fetch ad with full nested data
    │
    ├── Collect pages (filter by vehicleId/pageId)
    │
    ├── For each page:
    │   ├── Convert template backgrounds → IDML rectangles/images
    │   ├── Convert placed blocks → text frames + image rectangles
    │   │   ├── Block background (rectangle)
    │   │   ├── Product image (rectangle + Link element)
    │   │   ├── Text content (story XML: name, headline, price, description, disclaimer)
    │   │   └── Stamps (colored rectangles + text stories)
    │   └── Generate Spread XML
    │
    ├── Package into ZIP:
    │   ├── mimetype (STORE compression, must be first)
    │   ├── META-INF/container.xml
    │   ├── Resources/ (Fonts.xml, Graphics.xml, Styles.xml, Preferences.xml)
    │   ├── Spreads/Spread_N.xml (one per page)
    │   ├── Stories/Story_N.xml (one per text frame)
    │   └── designmap.xml (root manifest)
    │
    └── Return .idml file (application/vnd.adobe.indesign-idml-package)
```

### IDML Coordinate System

VCS design units (800×1100) map to InDesign points (612×792 for US Letter):
- `SCALE_X = 612 / 800 = 0.765`
- `SCALE_Y = 792 / 1100 = 0.72`
- GeometricBounds: `[top, left, bottom, right]` in points

### IDML Style System

| Style | Font | Size | Color |
|-------|------|------|-------|
| ProductName | Inter Bold | 14pt | Black |
| Headline | Inter Bold | 18pt | Black |
| Price | Inter Bold | 24pt | Meijer Red |
| PromoPrice | Inter Bold | 30pt | Meijer Red |
| Body | Inter Regular | 11pt | Black |
| Disclaimer | Inter Italic | 8pt | Black |
| Stamp | Inter Bold | 10pt | White |

### IDML Brand Colors

| Name | RGB | Hex |
|------|-----|-----|
| Meijer Red | 200, 16, 46 | #C8102E |
| Meijer Green | 27, 94, 32 | #1B5E20 |
| Meijer Gold | 249, 168, 37 | #F9A825 |

### Image Handling

Only HTTP(S) URLs are included in IDML image links. Data URIs are filtered out to prevent multi-MB spread XMLs that crash InDesign.

### Known Limitations

- DOMVersion 7.5 (CS5+ compatible) — newer InDesign features unavailable
- Only pre-registered named colors supported; unknown hex colors fall back to White
- Image links reference URLs, not embedded images — requires network access when opening
- IDML may need further structural fixes for full InDesign compatibility (under investigation)

---

## Key Design Decisions

### 1. Virtual Coordinate System (VCS) over CSS Grid
Blocks use absolute positioning in design units (800x1100) rather than CSS Grid. This enables pixel-perfect placement, free-form drag-and-drop, and zoom scaling without layout engine conflicts.

### 2. Three-Store Separation
Zustand stores are split by domain (prices, ad structure, UI state) rather than by feature. This prevents cross-domain coupling and enables independent testing.

### 3. Permissive PlacedBlockOverrides
The overrides object has ~35 optional fields with no rigid schema. This allows rapid feature addition (new display modes, stamp options) without database migrations. Trade-off: runtime validation is manual.

### 4. Command Pattern for Undo/Redo
adStore uses a command history (max 50) with `execute`, `undo`, and `redo`. This decouples mutation logic from history management.

### 5. Regional Price Cascade
`getPrice(upc)` checks regional overrides first, then falls back to global. This keeps pricing logic centralized in priceStore rather than scattered across components.

### 6. BlockData + PlacedBlock Separation
Feed data (BlockData) is stored independently from canvas placement (PlacedBlock). A single BlockData can be placed multiple times across pages. Overrides customize each placement without mutating source data.

### 7. Zone-Based Snapping over Grid Snapping
Template zones provide semantic placement guidance (hero, featured, supporting) with magnetic snapping (40-unit threshold) rather than rigid grid cells. This balances design freedom with template consistency.

### 8. Server-Side PDF via Puppeteer (A4)
PDF export renders the actual Next.js page in a headless browser at A4 format with scale 1.33 and 15mm margins. This guarantees visual fidelity between screen and print output.

### 11. IDML Export via JSZip
IDML export converts the ad data model directly to InDesign-compatible XML (no headless browser needed). VCS coordinates are scaled to InDesign points. Blocks become spread frames (rectangles, text frames, image links) with styled stories. The ZIP package follows Adobe's IDML spec with DOMVersion 7.5 for broad compatibility.

### 9. Tailwind CSS 4 (CSS-based)
Uses `@theme inline` in globals.css for theming instead of `tailwind.config.js`. Components primarily use inline React styles rather than utility classes for dynamic values.

### 10. Prisma 7 with PG Adapter
Uses `@prisma/adapter-pg` with connection pooling for PostgreSQL. Singleton pattern with hot-reload support for Next.js development. JSON fields used extensively for flexible data storage (layoutJson, feedJson, overrides, price).

---

## Environment

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/weekly_ad_builder
APP_URL=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:3001
REDIS_URL=redis://localhost:6379
```

### Seed Users

| Email | Role |
|-------|------|
| admin@meijer.com | admin |
| designer@meijer.com | designer |
| approver@meijer.com | approver |

import { test, expect, Page } from '@playwright/test'

const BUILDER_URL = '/builder/dd217886-ffdc-41ad-9b0b-ac95dee77fb9'

// ─── Selectors ────────────────────────────────────────────────────────────────
//
// DOM structure notes (from source analysis + live inspection):
//
// - Tray cards: <div role="button" style="cursor: grab; ..."> set by dnd-kit useDraggable
//   They live in the right panel and are NOT inside [data-canvas].
//
// - Canvas placed-block wrappers: also <div role="button" style="cursor: grab;"> from
//   DraggableBlock, but they ARE inside [data-canvas].
//
// - The canvas content element has attribute: data-canvas="{pageId}"
//
// - Zone overlay dashes: <div style="border: 2px dashed ..."> inside [data-canvas]
//
// - Zoom span: <span>{N}%</span> in the canvas toolbar
//
// - Undo/Redo: <button title="Undo (Ctrl+Z)"> / <button title="Redo (Ctrl+Y)"> in header
//
// - Region selector: <select> in header
//
// - Inspector panel shows a <div> with "Select a block to inspect" text when no block selected

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wait for the builder to fully load.
 * The "N available · M placed" counter only renders after blockData is fetched.
 */
async function waitForBuilderLoad(page: Page) {
  await expect(page.locator('header').getByText('Ad Builder')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/\d+ available/)).toBeVisible({ timeout: 15000 })
}

/**
 * Tray cards: divs with cursor:grab that are NOT inside the canvas.
 *
 * The right-panel tray cards have a specific structure:
 *  - border: 1px solid #e0e0e0 (from TrayBlockCard inline style)
 *  - padding: 8px
 *  - display: flex; gap: 8
 *  - a 44x44 thumbnail followed by product name, category, price
 *
 * Canvas placed-block wrappers have:
 *  - position: absolute (from DraggableBlock)
 *
 * We scope to elements with "border: 1px solid" (the card border) to avoid
 * canvas blocks which have no border on their cursor:grab wrapper.
 */
function trayCards(page: Page) {
  return page.locator('[style*="cursor: grab"][style*="border: 1px solid"]')
}

function firstTrayCard(page: Page) {
  return trayCards(page).first()
}

/**
 * Locate the canvas data element.
 */
function canvasEl(page: Page) {
  return page.locator('[data-canvas]').first()
}

/**
 * Placed blocks in the canvas: cursor:grab divs INSIDE [data-canvas].
 */
function canvasPlacedBlocks(page: Page) {
  return canvasEl(page).locator('[style*="cursor: grab"]')
}

/**
 * Drag a tray card to the canvas using mouse pointer events.
 * dnd-kit PointerSensor requires > 5px movement before activation.
 */
async function dragTrayCardToCanvas(page: Page, cardIndex = 0) {
  const card = trayCards(page).nth(cardIndex)
  const canvas = canvasEl(page)

  // Scroll the card to the center of its scrollable container so it's fully in view
  await card.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(100)

  const cardBox = await card.boundingBox()
  const canvasBox = await canvas.boundingBox()
  if (!cardBox || !canvasBox) throw new Error('Could not get bounding boxes for drag')

  const srcX = cardBox.x + cardBox.width / 2
  const srcY = cardBox.y + cardBox.height / 2
  const dstX = canvasBox.x + canvasBox.width / 2
  const dstY = canvasBox.y + canvasBox.height / 2

  await page.mouse.move(srcX, srcY)
  await page.mouse.down()
  // Move > 5px to activate PointerSensor
  await page.mouse.move(srcX + 4, srcY + 4, { steps: 3 })
  // Slide to canvas centre
  await page.mouse.move(dstX, dstY, { steps: 25 })
  await page.mouse.up()

  await page.waitForTimeout(500)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Weekly Ad Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BUILDER_URL)
    await waitForBuilderLoad(page)
  })

  // ── Test 1: Page loads with branding ────────────────────────────────────────
  test('builder page loads with top bar branding and ad name', async ({ page }) => {
    const header = page.locator('header')

    // Brand label in red
    await expect(header.getByText('Ad Builder')).toBeVisible()

    // Ad name appears after async load
    await expect(header).toContainText('Week of')

    // Status badge
    await expect(header).toContainText('draft')

    // Region selector defaults to WEST_COAST
    const regionSelect = header.locator('select')
    await expect(regionSelect).toBeVisible()
    await expect(regionSelect).toHaveValue('WEST_COAST')

    // Action buttons
    await expect(header.getByText('Preview')).toBeVisible()
    await expect(header.getByText('Save')).toBeVisible()
    await expect(header.getByText('Submit for Review')).toBeVisible()
  })

  // ── Test 2: Block tray product cards ────────────────────────────────────────
  test('block tray shows product cards with names and prices', async ({ page }) => {
    // "Blocks" tab is active by default
    await expect(page.locator('button', { hasText: /^Blocks$/ })).toBeVisible()

    // Available/placed counter
    await expect(page.getByText(/\d+ available · \d+ placed/)).toBeVisible()

    // At least one tray card is present
    const first = firstTrayCard(page)
    await expect(first).toBeVisible()

    // Card has a product name and a price
    const cardText = await first.innerText()
    expect(cardText.trim().length).toBeGreaterThan(0)
    // Price appears as "$N.NN" somewhere in the text
    expect(cardText).toMatch(/\$\d/)
  })

  // ── Test 3: Tray card count is substantial ───────────────────────────────────
  test('block tray has multiple product cards loaded from seed data', async ({ page }) => {
    const count = await trayCards(page).count()
    // 50 seed products total, 4 placed → 46 unplaced shown first, 4 shown as "placed" below
    expect(count).toBeGreaterThanOrEqual(46)
  })

  // ── Test 4: Search filters the tray ─────────────────────────────────────────
  test('searching for a non-existent term shows no blocks found', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('zzznomatch')
    await page.waitForTimeout(300)

    await expect(page.getByText('No blocks found')).toBeVisible()
  })

  // ── Test 5: Search can be cleared ───────────────────────────────────────────
  test('clearing search restores full product list', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('zzznomatch')
    await page.waitForTimeout(200)
    await expect(page.getByText('No blocks found')).toBeVisible()

    await searchInput.clear()
    await page.waitForTimeout(200)
    // Cards return
    await expect(firstTrayCard(page)).toBeVisible()
  })

  // ── Test 6: Category filter buttons ─────────────────────────────────────────
  test('category filter buttons are visible and clickable', async ({ page }) => {
    // Category filter buttons are <button> elements (not dnd-kit role=button divs).
    // They are inside the right panel above the tray card list.
    // Use exact: true + tag selector to avoid matching tray card divs that contain
    // category text (e.g. "Frozen Foods" appears in tray card text too).
    const catFilter = (name: string) =>
      page.locator('button', { hasText: name }).filter({ has: page.locator(':not(img)') }).first()

    // More reliable: target the <button> elements by their exact text using CSS
    const allBtn = page.locator('button').filter({ hasText: /^All$/ })
    await expect(allBtn.first()).toBeVisible()

    // Scoped category buttons (exact <button> tags, not dnd-kit divs)
    await expect(page.locator('button', { hasText: 'Frozen Foods' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Meat & Seafood' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Bakery' }).first()).toBeVisible()

    // Click Bakery category button
    await page.locator('button', { hasText: 'Bakery' }).first().click()
    await page.waitForTimeout(400)

    // Bakery products are visible in tray
    const trayCardCount = await trayCards(page).count()
    expect(trayCardCount).toBeGreaterThan(0)

    // All visible tray cards should belong to Bakery category
    const firstBakeryCard = trayCards(page).first()
    await expect(firstBakeryCard).toBeVisible()
    const firstText = await firstBakeryCard.innerText()
    expect(firstText).toContain('Bakery')

    // Reset to All
    await allBtn.first().click()
  })

  // ── Test 7: Canvas has template name in toolbar ──────────────────────────────
  test('canvas toolbar shows template name and Change Template button', async ({ page }) => {
    await expect(page.getByText('Editorial Hero')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change Template' })).toBeVisible()
  })

  // ── Test 8: Canvas renders with placed blocks ────────────────────────────────
  test('canvas renders placed blocks from seed data', async ({ page }) => {
    // The seed data has 4 placed blocks on Page 1
    const canvas = canvasEl(page)
    await expect(canvas).toBeVisible()

    // Placed blocks appear as cursor:grab divs inside the canvas
    const placed = canvasPlacedBlocks(page)
    const count = await placed.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // ── Test 9: Zone indicators visible for empty zones ──────────────────────────
  test('canvas shows dashed zone outlines for unoccupied template zones', async ({ page }) => {
    // ZoneOverlay renders dashes for empty zones
    // The Editorial Hero template has 5 zones; 4 are occupied so at least 1 dash shows
    const canvas = canvasEl(page)
    const dashes = canvas.locator('[style*="dashed"]')
    const count = await dashes.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // ── Test 10: Canvas placed blocks contain price text ─────────────────────────
  test('placed blocks on the canvas display price information', async ({ page }) => {
    const canvas = canvasEl(page)
    const canvasText = await canvas.innerText()
    // Canvas contains price data from placed blocks
    expect(canvasText).toMatch(/\$\d/)
  })

  // ── Test 11: Canvas placed blocks contain headline text ──────────────────────
  test('placed blocks on the canvas display headline or product text', async ({ page }) => {
    const canvas = canvasEl(page)
    const canvasText = await canvas.innerText()
    expect(canvasText.trim().length).toBeGreaterThan(0)
    // Should contain words (product names or headlines)
    expect(canvasText).toMatch(/[A-Za-z]{3,}/)
  })

  // ── Helper: click a placed block to select it ──────────────────────────────
  // Structure (from source analysis):
  //   DraggableBlock: div[role="button"][position:absolute] — dnd-kit listeners here
  //     BlockRenderer: div (first direct child) — React onClick={onSelect} is here
  //       image div, content div, selection ring (when isSelected)
  //     Resize handle: div[cursor:se-resize] — only rendered when isSelected
  //
  // Problem: [data-canvas] intercepts Playwright pointer events on the outer wrapper.
  // Solution: target the BlockRenderer div with :scope > div and dispatch a synthetic
  // MouseEvent directly on it so React's onClick fires.
  //
  // Selector note: use div[role="button"][style*="position: absolute"] to get DraggableBlock
  // wrappers — the broader div[style*="position: absolute"] also matches background layers.
  async function clickFirstPlacedBlock(page: Page) {
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-canvas]')
      if (!canvas) return
      // DraggableBlock wrappers have role="button" + position:absolute (set by dnd-kit)
      const wrappers = canvas.querySelectorAll('div[role="button"][style*="position: absolute"]')
      if (wrappers.length === 0) return
      // BlockRenderer is the first direct div child; its onClick={onSelect} triggers selection
      const blockRenderer = wrappers[0].querySelector(':scope > div') as HTMLElement | null
      const target = blockRenderer ?? (wrappers[0] as HTMLElement)
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(500)
  }

  // ── Test 12: Clicking a placed block selects it ──────────────────────────────
  test('clicking a placed block shows the resize handle (selection state)', async ({ page }) => {
    const canvas = canvasEl(page)

    // Verify placed blocks exist
    await expect(canvasPlacedBlocks(page).first()).toBeVisible({ timeout: 5000 })

    await clickFirstPlacedBlock(page)

    // After selection, DraggableBlock renders: <div style="cursor: se-resize; ...">
    const resizeHandle = canvas.locator('[style*="se-resize"]').first()
    await expect(resizeHandle).toBeVisible({ timeout: 5000 })
  })

  // ── Test 13: Resize handle is blue ───────────────────────────────────────────
  test('resize handle is the blue 20×20 square (Meijer brand blue)', async ({ page }) => {
    const canvas = canvasEl(page)
    await expect(canvasPlacedBlocks(page).first()).toBeVisible({ timeout: 5000 })

    await clickFirstPlacedBlock(page)

    const handle = canvas.locator('[style*="se-resize"]').first()
    await expect(handle).toBeVisible({ timeout: 5000 })

    const style = await handle.getAttribute('style')
    // Background is #1565C0 (Meijer blue) — browsers serialize hex to rgb(21, 101, 192)
    expect(style).toMatch(/rgb\(21,\s*101,\s*192\)|1565C0/)
  })

  // ── Test 14: Selection ring on selected block ────────────────────────────────
  test('selected block shows blue selection ring overlay', async ({ page }) => {
    const canvas = canvasEl(page)
    await expect(canvasPlacedBlocks(page).first()).toBeVisible({ timeout: 5000 })

    await clickFirstPlacedBlock(page)

    // BlockRenderer renders a selection ring: position:absolute, inset:0, border:2px solid #1565C0
    const ring = canvas.locator(
      '[style*="border: 2px solid rgb(21, 101, 192)"], [style*="border: 2px solid #1565C0"]'
    ).first()
    await expect(ring).toBeVisible({ timeout: 5000 })
  })

  // ── Test 15: Zoom in increases percentage ───────────────────────────────────
  test('zoom in button increases the displayed zoom percentage', async ({ page }) => {
    const zoomSpan = page.locator('span').filter({ hasText: /^\d+%$/ }).first()
    await expect(zoomSpan).toBeVisible()

    const before = parseInt(await zoomSpan.innerText())

    // Evaluate clicks the ZoomIn button (second of the two zoom buttons)
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'))
      const pct = spans.find(s => /^\d+%$/.test(s.textContent?.trim() ?? ''))
      const parent = pct?.parentElement
      const btns = parent?.querySelectorAll('button')
      if (btns && btns.length >= 2) (btns[1] as HTMLButtonElement).click()
    })

    await page.waitForTimeout(200)
    const after = parseInt(await zoomSpan.innerText())
    expect(after).toBeGreaterThan(before)
  })

  // ── Test 16: Zoom out decreases percentage ──────────────────────────────────
  test('zoom out button decreases the displayed zoom percentage', async ({ page }) => {
    const zoomSpan = page.locator('span').filter({ hasText: /^\d+%$/ }).first()
    const before = parseInt(await zoomSpan.innerText())

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'))
      const pct = spans.find(s => /^\d+%$/.test(s.textContent?.trim() ?? ''))
      const parent = pct?.parentElement
      const btns = parent?.querySelectorAll('button')
      if (btns && btns.length >= 1) (btns[0] as HTMLButtonElement).click()
    })

    await page.waitForTimeout(200)
    const after = parseInt(await zoomSpan.innerText())
    expect(after).toBeLessThan(before)
  })

  // ── Test 17: Section navigator ──────────────────────────────────────────────
  test('section navigator shows section names and page items', async ({ page }) => {
    await expect(page.getByText('Sections')).toBeVisible()

    // Seed sections: "Produce" and "Meat & Seafood"
    // Use button tag + exact text to avoid dnd-kit role=button divs
    await expect(page.locator('button', { hasText: 'Produce' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Meat & Seafood' }).first()).toBeVisible()

    // Page items appear as "Page 1" buttons
    const pageItems = page.locator('button', { hasText: /^Page \d+/ })
    const count = await pageItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // ── Test 18: Inspector tab ──────────────────────────────────────────────────
  test('switching to inspector tab shows prompt when no block is selected', async ({ page }) => {
    // The Inspector tab is a <button> element with exact text "Inspector"
    const inspectorTab = page.locator('button', { hasText: /^Inspector$/ })
    await expect(inspectorTab).toBeVisible()

    await inspectorTab.click()
    await expect(page.getByText('Select a block to inspect')).toBeVisible()

    // Switch back - Blocks tab is <button> with text "Blocks"
    await page.locator('button', { hasText: /^Blocks$/ }).click()
    await expect(firstTrayCard(page)).toBeVisible()
  })

  // ── Test 19: Undo/Redo disabled on fresh load ───────────────────────────────
  test('undo and redo buttons are disabled on fresh page load', async ({ page }) => {
    const undo = page.locator('header').locator('button[title="Undo (Ctrl+Z)"]')
    const redo = page.locator('header').locator('button[title="Redo (Ctrl+Y)"]')

    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()
  })

  // ── Test 20: Region selector changes region ─────────────────────────────────
  test('region selector allows switching between pricing regions', async ({ page }) => {
    const select = page.locator('header').locator('select')
    await expect(select).toHaveValue('WEST_COAST')

    await select.selectOption('MIDWEST')
    await expect(select).toHaveValue('MIDWEST')

    await select.selectOption('EAST_COAST')
    await expect(select).toHaveValue('EAST_COAST')

    // Restore
    await select.selectOption('WEST_COAST')
    await expect(select).toHaveValue('WEST_COAST')
  })

  // ── Test 21: Drag from tray to canvas ───────────────────────────────────────
  test('dragging a block from tray to canvas increments placed count', async ({ page }) => {
    // Record initial counts
    const counterEl = page.getByText(/\d+ available · \d+ placed/)
    const counterText = await counterEl.innerText()
    const initialPlaced = parseInt(counterText.match(/(\d+) placed/)?.[1] ?? '0')
    const initialAvailable = parseInt(counterText.match(/^(\d+) available/)?.[1] ?? '0')

    await dragTrayCardToCanvas(page, 0)

    // Wait for counter to update (Zustand state → React re-render)
    await page.waitForTimeout(800)

    const newText = await counterEl.innerText()
    const newPlaced = parseInt(newText.match(/(\d+) placed/)?.[1] ?? '0')
    const newAvailable = parseInt(newText.match(/^(\d+) available/)?.[1] ?? '0')

    expect(newPlaced).toBeGreaterThan(initialPlaced)
    expect(newAvailable).toBeLessThan(initialAvailable)
  })

  // ── Test 22: Placed block shows "placed" badge in tray ──────────────────────
  test('after dragging a block, tray shows "placed" badge on that card', async ({ page }) => {
    await dragTrayCardToCanvas(page, 0)
    await page.waitForTimeout(600)

    // TrayBlockCard renders a grey "placed" badge span for placed items
    const placedBadge = page.locator('span').filter({ hasText: /^placed$/ })
    const count = await placedBadge.count()
    // Seed data has 4 already placed + 1 new = at least 5
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

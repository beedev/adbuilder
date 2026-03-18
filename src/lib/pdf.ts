import puppeteer, { Browser } from 'puppeteer'

let _browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })
  return _browser
}

// Release browser on process exit to avoid zombie Chrome processes
process.on('exit', () => { _browser?.close().catch(() => {}) })
process.on('SIGINT', () => { _browser?.close().catch(() => {}); process.exit(0) })
process.on('SIGTERM', () => { _browser?.close().catch(() => {}); process.exit(0) })

export async function generateAdPdf(adId: string): Promise<Uint8Array> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000'
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // Render at canvas native size (800×1100 design units)
    await page.setViewport({ width: 800, height: 1100, deviceScaleFactor: 1 })

    await page.goto(`${baseUrl}/ad-print/${adId}`, {
      waitUntil: 'networkidle2',
      timeout: 30_000,
    })

    // Reset body margins and inject @page rule for A4
    await page.evaluate(() => {
      document.body.style.margin = '0'
      document.body.style.padding = '0'
    })

    // Wait for the client component to signal all images are loaded
    await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 30_000 })

    // A4 = 210mm × 297mm.  Margins 15mm each side.
    // Printable area = 180mm × 267mm.
    // Content is 800 CSS px = 600pt = 211.67mm at 72dpi.
    // Scale to fit: 180 / 211.67 ≈ 0.85, then × 1.5 = 1.275
    // Puppeteer max scale is 2.0 — 1.275 is within range.
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: 1.33,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return new Uint8Array(pdfBuffer)
  } finally {
    // Always close the tab; keep the browser alive for reuse
    await page.close()
  }
}

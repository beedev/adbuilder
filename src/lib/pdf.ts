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
    // Match the canvas native width so blocks render at 1:1 scale
    await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 1 })

    await page.goto(`${baseUrl}/ad-print/${adId}`, {
      waitUntil: 'networkidle2',
      timeout: 30_000,
    })

    // Wait for the client component to signal all images are loaded
    await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 30_000 })

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1100px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return new Uint8Array(pdfBuffer)
  } finally {
    // Always close the tab; keep the browser alive for reuse
    await page.close()
  }
}

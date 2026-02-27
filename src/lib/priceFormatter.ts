import { PriceData } from '@/types'

export function formatPrice(price: PriceData): string {
  if (!price) return ''

  switch (price.priceType) {
    case 'bogo':
      return 'Buy 1,\nGet 1 Free'
    case 'pct_off':
      return `${price.percentOff}%\nOFF`
    case 'x_for_y':
      return price.priceDisplay || `${price.unitCount} for $${price.adPrice}`
    case 'per_lb':
      return price.adPrice ? `$${price.adPrice.toFixed(2)}\n/lb` : price.priceDisplay
    case 'each':
    default:
      return price.adPrice ? `$${price.adPrice.toFixed(2)}` : price.priceDisplay
  }
}

export function formatPriceParts(price: PriceData): {
  main: string;
  unit?: string;
  cents?: string;
  isBig: boolean
} {
  if (!price) return { main: '', isBig: false }

  if (price.priceType === 'bogo') {
    return { main: 'BUY 1', unit: 'GET 1 FREE', isBig: false }
  }

  if (price.priceType === 'pct_off') {
    return { main: `${price.percentOff}%`, unit: 'OFF', isBig: true }
  }

  if (price.priceType === 'x_for_y' && price.unitCount) {
    return { main: `${price.unitCount}`, unit: `FOR $${price.adPrice?.toFixed(2)}`, isBig: true }
  }

  if (price.adPrice !== null && price.adPrice !== undefined) {
    const [dollars, cents] = price.adPrice.toFixed(2).split('.')
    const unit = price.priceType === 'per_lb' ? '/lb' : 'ea'
    return { main: `$${dollars}`, cents, unit, isBig: true }
  }

  return { main: price.priceDisplay, isBig: false }
}

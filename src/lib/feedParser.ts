import { XMLParser } from 'fast-xml-parser'

export function parseFeed(content: string, contentType: 'json' | 'xml'): unknown[] {
  if (contentType === 'json') {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const result = parser.parse(content)
  const blocks = result?.blocks?.block || result?.block || result
  return Array.isArray(blocks) ? blocks : [blocks]
}

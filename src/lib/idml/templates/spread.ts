/**
 * Spread XML generation — each page becomes one spread.
 * Frames (text + image) are positioned using geometric bounds.
 */

import { pageDimensions } from '../coordinates'

export interface SpreadFrame {
  selfId: string
  type: 'text' | 'image' | 'rectangle'
  geoBounds: [number, number, number, number] // [top, left, bottom, right]
  storyId?: string        // for text frames
  imageUrl?: string       // for image frames
  fillColor?: string      // Color Self reference
  strokeColor?: string
  strokeWeight?: number
  zIndex?: number
}

/** Generate a complete Spread XML file with one page and its frames. */
export function spreadXml(
  spreadId: string,
  pageId: string,
  frames: SpreadFrame[],
  landscape = false,
): string {
  const dims = pageDimensions(landscape)
  const pageGeoBounds = `0 0 ${dims.height.toFixed(2)} ${dims.width.toFixed(2)}`

  const sortedFrames = [...frames].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  const frameXmls = sortedFrames.map(f => renderFrame(f)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Spread xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <Spread Self="${spreadId}" PageCount="1"
    FlattenerOverride="Default"
    ShowMasterItems="true" ItemTransform="1 0 0 1 0 0">
    <Page Self="${pageId}"
      AppliedMaster="n"
      GeometricBounds="${pageGeoBounds}"
      ItemTransform="1 0 0 1 0 0"
      Name="${pageId}" />
    <FlattenerPreference />
${frameXmls}
  </Spread>
</idPkg:Spread>`
}

function renderFrame(frame: SpreadFrame): string {
  const bounds = frame.geoBounds.map(v => v.toFixed(2)).join(' ')
  const fill = frame.fillColor ?? 'Color/None'
  const stroke = frame.strokeColor ?? 'Color/None'
  const strokeW = frame.strokeWeight ?? 0

  // PathPointArray for rectangle geometry
  const [top, left, bottom, right] = frame.geoBounds
  const pathPoints = rectPathPoints(top, left, bottom, right)

  switch (frame.type) {
    case 'text':
      return `    <TextFrame Self="${frame.selfId}"
      ParentStory="${frame.storyId}"
      ContentType="TextType"
      GeometricBounds="${bounds}"
      ItemTransform="1 0 0 1 0 0"
      FillColor="${fill}"
      StrokeColor="${stroke}"
      StrokeWeight="${strokeW}">
      <TextFramePreference AutoSizingReferencePoint="TopLeftAnchor"
        AutoSizingType="Off" />
      <Properties>
        <PathGeometry>
          <GeometryPathType PathOpen="false">
            <PathPointArray>
${pathPoints}
            </PathPointArray>
          </GeometryPathType>
        </PathGeometry>
      </Properties>
    </TextFrame>`

    case 'image':
      return `    <Rectangle Self="${frame.selfId}"
      GeometricBounds="${bounds}"
      ItemTransform="1 0 0 1 0 0"
      FillColor="${fill}"
      StrokeColor="${stroke}"
      StrokeWeight="${strokeW}"
      ContentType="GraphicType">
      <Properties>
        <PathGeometry>
          <GeometryPathType PathOpen="false">
            <PathPointArray>
${pathPoints}
            </PathPointArray>
          </GeometryPathType>
        </PathGeometry>
      </Properties>${frame.imageUrl ? `
      <Image Self="${frame.selfId}_img"
        ItemTransform="1 0 0 1 0 0">
        <Link Self="${frame.selfId}_link"
          LinkResourceURI="${escapeXml(frame.imageUrl)}"
          StoredState="Normal"
          LinkClassID="35906" />
        <Properties>
          <Profile type="string">$ID/</Profile>
        </Properties>
      </Image>` : ''}
    </Rectangle>`

    case 'rectangle':
      return `    <Rectangle Self="${frame.selfId}"
      GeometricBounds="${bounds}"
      ItemTransform="1 0 0 1 0 0"
      FillColor="${fill}"
      StrokeColor="${stroke}"
      StrokeWeight="${strokeW}"
      ContentType="Unassigned">
      <Properties>
        <PathGeometry>
          <GeometryPathType PathOpen="false">
            <PathPointArray>
${pathPoints}
            </PathPointArray>
          </GeometryPathType>
        </PathGeometry>
      </Properties>
    </Rectangle>`
  }
}

function rectPathPoints(top: number, left: number, bottom: number, right: number): string {
  const corners = [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ]
  return corners
    .map(([x, y]) => {
      const pt = `${x.toFixed(2)} ${y.toFixed(2)}`
      return `              <PathPointType Anchor="${pt}" LeftDirection="${pt}" RightDirection="${pt}" />`
    })
    .join('\n')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

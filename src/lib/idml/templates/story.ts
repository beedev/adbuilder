/**
 * Story XML generation — each text frame references a Story for its content.
 * A story contains paragraph style ranges with character content.
 */

interface StoryParagraph {
  text: string
  style: string  // ParagraphStyle Self reference (e.g. "ParagraphStyle/Headline")
}

/** Generate a complete Story XML file for a text frame. */
export function storyXml(storyId: string, paragraphs: StoryParagraph[]): string {
  const pRanges = paragraphs
    .filter(p => p.text.trim().length > 0)
    .map(p => {
      const escaped = escapeXml(p.text)
      return `    <ParagraphStyleRange AppliedParagraphStyle="${p.style}">
      <CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[None]">
        <Content>${escaped}</Content>
      </CharacterStyleRange>
    </ParagraphStyleRange>`
    })
    .join('\n    <Br />\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Story xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <Story Self="${storyId}" AppliedTOCStyle="n" TrackChanges="false"
    StoryTitle="" AppliedNamedGrid="n">
${pRanges}
  </Story>
</idPkg:Story>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

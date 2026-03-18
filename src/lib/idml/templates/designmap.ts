/**
 * designmap.xml — document manifest referencing all spreads, stories, and resources.
 */

export function designmapXml(
  spreadIds: string[],
  storyIds: string[],
): string {
  const spreadRefs = spreadIds
    .map(id => `  <idPkg:Spread src="Spreads/${id}.xml" />`)
    .join('\n')

  const storyRefs = storyIds
    .map(id => `  <idPkg:Story src="Stories/${id}.xml" />`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Document Self="d"
  xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5"
  StoryList="${storyIds.join(' ')}"
  ActiveLayer="Layer_1">
  <Language Self="Language/$ID/English%3a USA" Name="$ID/English: USA"
    SingleQuotes="&#x2018;&#x2019;" DoubleQuotes="&#x201c;&#x201d;"
    ICULocaleName="en_US" />
  <Layer Self="Layer_1" Name="Layer 1" Visible="true" Locked="false" />
  <idPkg:Graphic src="Resources/Graphics.xml" />
  <idPkg:Fonts src="Resources/Fonts.xml" />
  <idPkg:Styles src="Resources/Styles.xml" />
  <idPkg:Preferences src="Resources/Preferences.xml" />
${spreadRefs}
${storyRefs}
  <Section Self="Section_1" PageNumberStart="1" Length="${spreadIds.length}"
    Name="" PageStart="0" />
</Document>`
}

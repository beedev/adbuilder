/** META-INF/container.xml — declares file type and points to designmap. */
export function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<container>
  <rootfiles>
    <rootfile full-path="designmap.xml" media-type="application/vnd.adobe.indesign-idml" />
  </rootfiles>
</container>`
}

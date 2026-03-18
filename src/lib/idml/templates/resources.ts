/** Fonts.xml — declares font families used in the document. */
export function fontsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Fonts xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <FontFamily Self="FontFamily/Inter" Name="Inter">
    <Font Self="Font/Inter/Regular" FontFamily="Inter" Name="Inter"
      PostScriptName="Inter-Regular" FontStyleName="Regular"
      FontType="OpenTypeTT" WritingScript="0" />
    <Font Self="Font/Inter/Bold" FontFamily="Inter" Name="Inter Bold"
      PostScriptName="Inter-Bold" FontStyleName="Bold"
      FontType="OpenTypeTT" WritingScript="0" />
    <Font Self="Font/Inter/Italic" FontFamily="Inter" Name="Inter Italic"
      PostScriptName="Inter-Italic" FontStyleName="Italic"
      FontType="OpenTypeTT" WritingScript="0" />
  </FontFamily>
  <FontFamily Self="FontFamily/Arial" Name="Arial">
    <Font Self="Font/Arial/Regular" FontFamily="Arial" Name="Arial"
      PostScriptName="ArialMT" FontStyleName="Regular"
      FontType="TrueType" WritingScript="0" />
    <Font Self="Font/Arial/Bold" FontFamily="Arial" Name="Arial Bold"
      PostScriptName="Arial-BoldMT" FontStyleName="Bold"
      FontType="TrueType" WritingScript="0" />
  </FontFamily>
</idPkg:Fonts>`
}

/** Graphics.xml — colors, swatches, and inks. */
export function graphicsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Graphic xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <Color Self="Color/Black" Model="Process" Space="CMYK"
    ColorValue="0 0 0 100" Name="Black" />
  <Color Self="Color/White" Model="Process" Space="CMYK"
    ColorValue="0 0 0 0" Name="White" />
  <Color Self="Color/MeijerRed" Model="Process" Space="RGB"
    ColorValue="200 16 46" Name="Meijer Red" />
  <Color Self="Color/MeijerGreen" Model="Process" Space="RGB"
    ColorValue="27 94 32" Name="Meijer Green" />
  <Color Self="Color/MeijerGold" Model="Process" Space="RGB"
    ColorValue="249 168 37" Name="Meijer Gold" />
  <Color Self="Color/LightGray" Model="Process" Space="RGB"
    ColorValue="245 245 245" Name="Light Gray" />
  <Color Self="Color/None" Model="Process" Space="CMYK"
    ColorValue="0 0 0 0" Name="[None]" />
  <Swatch Self="Swatch/None" Name="None" ColorValue="Color/None" />
  <Swatch Self="Swatch/Black" Name="Black" ColorValue="Color/Black" />
  <Swatch Self="Swatch/White" Name="White" ColorValue="Color/White" />
  <Swatch Self="Swatch/MeijerRed" Name="Meijer Red" ColorValue="Color/MeijerRed" />
  <Swatch Self="Swatch/MeijerGreen" Name="Meijer Green" ColorValue="Color/MeijerGreen" />
  <Swatch Self="Swatch/MeijerGold" Name="Meijer Gold" ColorValue="Color/MeijerGold" />
  <Ink Self="Ink/Process" Name="Process" />
  <StrokeStyle Self="StrokeStyle/Solid" Name="Solid" />
</idPkg:Graphic>`
}

/** Styles.xml — paragraph and character style definitions. */
export function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Styles xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
  DOMVersion="7.5">
  <RootParagraphStyleGroup Self="RootParagraphStyleGroup">
    <ParagraphStyle Self="ParagraphStyle/$ID/NormalParagraphStyle"
      Name="$ID/NormalParagraphStyle"
      AppliedFont="Inter" FontStyle="Regular" PointSize="11"
      FillColor="Color/Black" />
    <ParagraphStyle Self="ParagraphStyle/Headline"
      Name="Headline"
      AppliedFont="Inter" FontStyle="Bold" PointSize="18"
      FillColor="Color/Black" SpaceBefore="0" SpaceAfter="4" />
    <ParagraphStyle Self="ParagraphStyle/Body"
      Name="Body"
      AppliedFont="Inter" FontStyle="Regular" PointSize="11"
      FillColor="Color/Black" SpaceBefore="0" SpaceAfter="2" />
    <ParagraphStyle Self="ParagraphStyle/Price"
      Name="Price"
      AppliedFont="Inter" FontStyle="Bold" PointSize="24"
      FillColor="Color/MeijerRed" SpaceBefore="2" SpaceAfter="0" />
    <ParagraphStyle Self="ParagraphStyle/PromoPrice"
      Name="PromoPrice"
      AppliedFont="Inter" FontStyle="Bold" PointSize="30"
      FillColor="Color/MeijerRed" SpaceBefore="2" SpaceAfter="0" />
    <ParagraphStyle Self="ParagraphStyle/Disclaimer"
      Name="Disclaimer"
      AppliedFont="Inter" FontStyle="Italic" PointSize="8"
      FillColor="Color/Black" SpaceBefore="2" SpaceAfter="0" />
    <ParagraphStyle Self="ParagraphStyle/ProductName"
      Name="ProductName"
      AppliedFont="Inter" FontStyle="Bold" PointSize="14"
      FillColor="Color/Black" SpaceBefore="0" SpaceAfter="2" />
    <ParagraphStyle Self="ParagraphStyle/Stamp"
      Name="Stamp"
      AppliedFont="Inter" FontStyle="Bold" PointSize="10"
      FillColor="Color/White" Justification="CenterAlign" />
  </RootParagraphStyleGroup>
  <RootCharacterStyleGroup Self="RootCharacterStyleGroup">
    <CharacterStyle Self="CharacterStyle/$ID/[None]" Name="$ID/[None]" />
    <CharacterStyle Self="CharacterStyle/Bold" Name="Bold"
      AppliedFont="Inter" FontStyle="Bold" />
    <CharacterStyle Self="CharacterStyle/PriceChar" Name="PriceChar"
      AppliedFont="Inter" FontStyle="Bold" FillColor="Color/MeijerRed" />
  </RootCharacterStyleGroup>
  <RootObjectStyleGroup Self="RootObjectStyleGroup">
    <ObjectStyle Self="ObjectStyle/$ID/[None]" Name="[None]" />
    <ObjectStyle Self="ObjectStyle/$ID/[Normal Graphics Frame]"
      Name="[Normal Graphics Frame]" />
    <ObjectStyle Self="ObjectStyle/$ID/[Normal Text Frame]"
      Name="[Normal Text Frame]" />
  </RootObjectStyleGroup>
  <RootTableStyleGroup Self="RootTableStyleGroup" />
  <RootCellStyleGroup Self="RootCellStyleGroup" />
</idPkg:Styles>`
}

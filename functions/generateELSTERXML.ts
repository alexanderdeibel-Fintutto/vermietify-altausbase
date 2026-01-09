import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    console.log(`Generating ELSTER XML for ${userId}, year ${taxYear}`);

    const user = await base44.auth.me();

    // Get all calculations
    const [kapRes, soRes, vgRes] = await Promise.all([
      base44.functions.invoke('calculateTaxKAP', { userId, taxYear, federalState: 'DE' }),
      base44.functions.invoke('calculateTaxSO', { userId, taxYear }),
      base44.functions.invoke('calculateTaxVG', { userId, taxYear })
    ]);

    const kap = kapRes.result;
    const so = soRes.result;
    const vg = vgRes.result;

    // Build ELSTER XML
    const elsterXML = `<?xml version="1.0" encoding="UTF-8"?>
<Steuererklarung TaxYear="${taxYear}" Version="2024">
  <Steuerpflichtiger>
    <Name>${user.full_name}</Name>
    <Email>${user.email}</Email>
  </Steuerpflichtiger>

  <AnlageKAP>
    <Gesamtbruttoeinkommen>${kap.totals.grossIncome}</Gesamtbruttoeinkommen>
    <Sparerpauschbetrag>${kap.totals.allowanceUsed}</Sparerpauschbetrag>
    <AuslaendischeQuellensteuer>${kap.totals.foreignTaxCredit}</AuslaendischeQuellensteuer>
    <ZuVersteuerndeEinkuenfte>${kap.totals.taxableIncome}</ZuVersteuerndeEinkuenfte>
    
    <Steuern>
      <Abgeltungssteuer>${kap.calculations.abgeltungssteuer}</Abgeltungssteuer>
      <Solidaritaetszuschlag>${kap.calculations.solidaritaetszuschlag}</Solidaritaetszuschlag>
      <Kirchensteuer>${kap.calculations.kirchensteuer}</Kirchensteuer>
      <EinbehaltenesteuerZuschlag>${kap.calculations.totalTaxWithheld}</EinbehaltenesteuerZuschlag>
    </Steuern>

    <ErtraegeSammlung>
      ${Object.entries(kap.totals.incomeByType).map(([type, amount]) => `
      <Ertrag>
        <Art>${type}</Art>
        <Betrag>${amount}</Betrag>
      </Ertrag>
      `).join('')}
    </ErtraegeSammlung>
  </AnlageKAP>

  <AnlageSO>
    <Gesamtbetrag>${so.totals.netIncome}</Gesamtbetrag>
    <Freigrenze>${so.threshold.freigrenze}</Freigrenze>
    <ZuVersteuerndeEinkuenfte>${so.threshold.taxable}</ZuVersteuerndeEinkuenfte>
    <Status>${so.threshold.isExempt ? 'STEUERFREI' : 'STEUERPFLICHTIG'}</Status>
    
    <EinkuenfteSammlung>
      ${Object.entries(so.totals.incomeByType).map(([type, amount]) => `
      <Einkunft>
        <Art>${type}</Art>
        <Betrag>${amount}</Betrag>
      </Einkunft>
      `).join('')}
    </EinkuenfteSammlung>
  </AnlageSO>

  <AnlageVG>
    <Gesamtgewinn>${vg.totals.totalGain}</Gesamtgewinn>
    <SteuerbefraiteGewinne>${vg.totals.exemptGains}</SteuerbefraiteGewinne>
    <Freigrenze>${vg.threshold.freigrenze}</Freigrenze>
    <ZuVersteuerndeGewinne>${vg.totals.taxableAfterThreshold}</ZuVersteuerndeGewinne>
    
    <VeraeuserungsgeschaefteSammlung>
      ${vg.gains.map(gain => `
      <Geschaeft>
        <Beschreibung>${gain.description}</Beschreibung>
        <Anlagetyp>${gain.assetType}</Anlagetyp>
        <JahreGehalten>${gain.yearsHeld}</JahreGehalten>
        <Gewinn>${gain.grossGain}</Gewinn>
        <IstSteuerbefreit>${gain.isExempt ? 'ja' : 'nein'}</IstSteuerbefreit>
      </Geschaeft>
      `).join('')}
    </VeraeuserungsgeschaefteSammlung>
  </AnlageVG>

  <Zusammenfassung>
    <Gesamtkapitalertraege>${kap.totals.grossIncome}</Gesamtkapitalertraege>
    <GesamtSonstigeEinkuenfte>${so.totals.netIncome}</GesamtSonstigeEinkuenfte>
    <GesamtVeraeuserungsgewinne>${vg.totals.totalGain}</GesamtVeraeuserungsgewinne>
    <GenerierungsDatum>${new Date().toISOString()}</GenerierungsDatum>
  </Zusammenfassung>
</Steuererklarung>`;

    // Upload XML
    const fileResponse = await base44.integrations.Core.UploadFile({
      file: elsterXML
    });

    return Response.json({
      success: true,
      file_url: fileResponse.file_url,
      file_name: `Steuererklarung_${taxYear}.xml`,
      message: 'ELSTER-XML erfolgreich erstellt'
    });
  } catch (error) {
    console.error('ELSTER XML error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear, formData } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Generating FINANZOnline XML for ${taxYear}`);

    // Fetch user data
    const [investments, otherIncomes, capitalGains] = await Promise.all([
      base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [],
      base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [],
      base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
    ]);

    // Build FINANZOnline XML structure (simplified)
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Steuererklarung xmlns="http://www.bmf.gv.at/steuererklarung">
  <Kopfdaten>
    <TaxYear>${taxYear}</TaxYear>
    <Steuernummer>${user.tax_id || 'PENDING'}</Steuernummer>
    <Name>${user.full_name}</Name>
    <Submission>
      <Timestamp>${new Date().toISOString()}</Timestamp>
      <Version>2026.01</Version>
    </Submission>
  </Kopfdaten>
  
  <Anlagen>
    <!-- Anlage KAP (Kapitalvermögen) -->
    <AnlageKAP>
      <Positionen>
        ${investments.map((inv, idx) => `
        <Position id="${idx + 1}">
          <Beschreibung>${inv.title}</Beschreibung>
          <InvestmentTyp>${inv.investment_type}</InvestmentTyp>
          <Ertrag>${(inv.gross_income || 0).toFixed(2)}</Ertrag>
          <KESt>${(inv.withheld_tax_kest || 0).toFixed(2)}</KESt>
          <Kirchensteuer>${(inv.church_tax || 0).toFixed(2)}</Kirchensteuer>
          <AuslaendischeQuellensteuer>${(inv.foreign_tax || 0).toFixed(2)}</AuslaendischeQuellensteuer>
        </Position>
        `).join('')}
      </Positionen>
      <Summen>
        <GesamtErtrag>${investments.reduce((s, i) => s + (i.gross_income || 0), 0).toFixed(2)}</GesamtErtrag>
        <GesamtKESt>${investments.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0).toFixed(2)}</GesamtKESt>
      </Summen>
    </AnlageKAP>

    <!-- Anlage SO (Sonstige Einkünfte) -->
    <AnlageSO>
      <Positionen>
        ${otherIncomes.map((oi, idx) => `
        <Position id="${idx + 1}">
          <Beschreibung>${oi.description}</Beschreibung>
          <Einkunftsart>${oi.income_type}</Einkunftsart>
          <Betrag>${(oi.amount || 0).toFixed(2)}</Betrag>
          <Einbehaltenesteuer>${(oi.withheld_tax || 0).toFixed(2)}</Einbehaltenesteuer>
          <AbzugsfaehigeAusgaben>${(oi.deductible_expenses || 0).toFixed(2)}</AbzugsfaehigeAusgaben>
        </Position>
        `).join('')}
      </Positionen>
      <Summen>
        <GesamtBetrag>${otherIncomes.reduce((s, oi) => s + (oi.amount || 0), 0).toFixed(2)}</GesamtBetrag>
      </Summen>
    </AnlageSO>

    <!-- Anlage VG (Veräußerungsgeschäfte) -->
    <AnlageVG>
      <Positionen>
        ${capitalGains.filter(cg => !cg.is_tax_exempt).map((cg, idx) => `
        <Position id="${idx + 1}">
          <Beschreibung>${cg.description}</Beschreibung>
          <VerkaeuferDatum>${cg.sale_date}</VerkaeuferDatum>
          <Kaufpreis>${(cg.acquisition_cost || 0).toFixed(2)}</Kaufpreis>
          <Verkaeuferspreis>${(cg.sale_price || 0).toFixed(2)}</Verkaeuferspreis>
          <Gewinn>${(cg.gain_loss || 0).toFixed(2)}</Gewinn>
        </Position>
        `).join('')}
      </Positionen>
      <Summen>
        <GesamtGewinn>${capitalGains.filter(cg => !cg.is_tax_exempt).reduce((s, cg) => s + (cg.gain_loss || 0), 0).toFixed(2)}</GesamtGewinn>
      </Summen>
    </AnlageVG>
  </Anlagen>
</Steuererklarung>`;

    // Upload XML file
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: xmlContent
    });

    return Response.json({
      success: true,
      file_url,
      fileName: `Steuererklarung_${taxYear}.xml`,
      taxYear,
      dataCount: {
        investments: investments.length,
        otherIncomes: otherIncomes.length,
        capitalGains: capitalGains.filter(cg => !cg.is_tax_exempt).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('XML generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
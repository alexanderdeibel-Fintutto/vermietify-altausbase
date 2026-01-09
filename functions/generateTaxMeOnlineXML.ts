import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, canton, filingData } = await req.json();

    if (!taxYear || !canton || !filingData) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Generiere TAX.me Online XML Format für Schweiz
    const xmlContent = generateTaxMeXML(user, taxYear, canton, filingData);

    return Response.json({
      status: 'success',
      xml: xmlContent,
      filename: `TAX_me_${canton}_${taxYear}_${user.email.split('@')[0]}.xml`,
      format: 'TAX_me_Online'
    });
  } catch (error) {
    console.error('Generate TAX.me Online XML error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateTaxMeXML(user, taxYear, canton, filingData) {
  const taxMeXML = `<?xml version="1.0" encoding="UTF-8"?>
<TaxDeclaration>
  <declaration_info>
    <submission_year>${taxYear}</submission_year>
    <canton_code>${canton}</canton_code>
    <submission_date>${new Date().toISOString()}</submission_date>
  </declaration_info>
  <taxpayer>
    <name>${user.full_name}</name>
    <email>${user.email}</email>
    <tax_residence>${canton}</tax_residence>
  </taxpayer>
  <income_statement>
    <employment>
      <gross_salary>${filingData.gross_salary || 0}</gross_salary>
      <allowances>${filingData.allowances || 0}</allowances>
    </employment>
    <business>
      <revenue>${filingData.revenue || 0}</revenue>
      <expenses>${filingData.expenses || 0}</expenses>
      <profit>${(filingData.revenue || 0) - (filingData.expenses || 0)}</profit>
    </business>
    <investment>
      <dividends>${filingData.dividends || 0}</dividends>
      <interest>${filingData.interest || 0}</interest>
      <capital_gains>${filingData.capital_gains || 0}</capital_gains>
    </investment>
    <real_estate>
      <rental_income>${filingData.rental_income || 0}</rental_income>
      <operating_costs>${filingData.operating_costs || 0}</operating_costs>
      <net_income>${(filingData.rental_income || 0) - (filingData.operating_costs || 0)}</net_income>
    </real_estate>
  </income_statement>
  <tax_details>
    <total_taxable_income>${calculateTotalIncome(filingData)}</total_taxable_income>
    <tax_amount>${filingData.tax_amount || 0}</tax_amount>
    <withholding_tax>${filingData.withholding_tax || 0}</withholding_tax>
    <balance>${(filingData.withholding_tax || 0) - (filingData.tax_amount || 0)}</balance>
  </tax_details>
  <documents>
    ${generateTaxMeDocuments(filingData.documents || [])}
  </documents>
</TaxDeclaration>`;

  return taxMeXML;
}

function calculateTotalIncome(data) {
  return (data.gross_salary || 0) + 
         ((data.revenue || 0) - (data.expenses || 0)) +
         (data.dividends || 0) + (data.interest || 0) + (data.capital_gains || 0) +
         ((data.rental_income || 0) - (data.operating_costs || 0));
}

function generateTaxMeDocuments(documents) {
  return documents.map((doc, i) => `
    <document id="doc_${i}">
      <name>${doc.name || 'Document'}</name>
      <type>${doc.type || 'other'}</type>
      <value>${doc.value || 0}</value>
    </document>`).join('\n');
}
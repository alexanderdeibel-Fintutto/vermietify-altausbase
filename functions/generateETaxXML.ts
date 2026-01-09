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

    // Generiere eTax XML Format für Schweiz
    const xmlContent = generateETaxXMLContent(user, taxYear, canton, filingData);

    return Response.json({
      status: 'success',
      xml: xmlContent,
      filename: `eTax_${canton}_${taxYear}_${user.email.split('@')[0]}.xml`,
      format: 'eTax_CH'
    });
  } catch (error) {
    console.error('Generate eTax XML error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateETaxXMLContent(user, taxYear, canton, filingData) {
  const eTaxXML = `<?xml version="1.0" encoding="UTF-8"?>
<eTaxDeclaration>
  <header>
    <year>${taxYear}</year>
    <canton>${canton}</canton>
    <taxpayer>
      <name>${user.full_name}</name>
      <email>${user.email}</email>
      <timestamp>${new Date().toISOString()}</timestamp>
    </taxpayer>
  </header>
  <income>
    <employment_income>${filingData.employment_income || 0}</employment_income>
    <self_employment_income>${filingData.self_employment_income || 0}</self_employment_income>
    <investment_income>${filingData.investment_income || 0}</investment_income>
    <real_estate_income>${filingData.real_estate_income || 0}</real_estate_income>
    <other_income>${filingData.other_income || 0}</other_income>
  </income>
  <deductions>
    <professional_expenses>${filingData.professional_expenses || 0}</professional_expenses>
    <real_estate_expenses>${filingData.real_estate_expenses || 0}</real_estate_expenses>
    <social_insurance>${filingData.social_insurance || 0}</social_insurance>
    <professional_education>${filingData.professional_education || 0}</professional_education>
    <wealth_deduction>${filingData.wealth_deduction || 0}</wealth_deduction>
  </deductions>
  <wealth>
    <real_estate_value>${filingData.real_estate_value || 0}</real_estate_value>
    <securities_value>${filingData.securities_value || 0}</securities_value>
    <cash_value>${filingData.cash_value || 0}</cash_value>
    <liabilities>${filingData.liabilities || 0}</liabilities>
    <taxable_wealth>${(filingData.real_estate_value || 0) + (filingData.securities_value || 0) + (filingData.cash_value || 0) - (filingData.liabilities || 0)}</taxable_wealth>
  </wealth>
  <documents>
    ${generateDocumentXML(filingData.documents || [])}
  </documents>
</eTaxDeclaration>`;

  return eTaxXML;
}

function generateDocumentXML(documents) {
  return documents.map((doc, i) => `
    <document id="doc_${i}">
      <type>${doc.type || 'other'}</type>
      <category>${doc.category || 'income'}</category>
      <amount>${doc.amount || 0}</amount>
    </document>`).join('\n');
}
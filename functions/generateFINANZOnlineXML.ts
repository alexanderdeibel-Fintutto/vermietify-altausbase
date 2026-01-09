import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, filingData } = await req.json();

    if (!taxYear || !filingData) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Generiere FINANZ Online XML Format für Österreich
    const xmlContent = generateXML(user, taxYear, filingData);

    return Response.json({
      status: 'success',
      xml: xmlContent,
      filename: `E1_${taxYear}_${user.email.split('@')[0]}.xml`,
      format: 'FINANZ_Online'
    });
  } catch (error) {
    console.error('Generate FINANZ Online XML error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateXML(user, taxYear, filingData) {
  const declaration = `<?xml version="1.0" encoding="UTF-8"?>
<declaration>
  <metadata>
    <tax_year>${taxYear}</tax_year>
    <taxpayer>
      <name>${user.full_name}</name>
      <email>${user.email}</email>
      <generated_at>${new Date().toISOString()}</generated_at>
    </taxpayer>
  </metadata>
  <form_e1>
    <income>
      <wages>${filingData.wages || 0}</wages>
      <capital_gains>${filingData.capital_gains || 0}</capital_gains>
      <rental_income>${filingData.rental_income || 0}</rental_income>
      <other_income>${filingData.other_income || 0}</other_income>
    </income>
    <deductions>
      <special_expenses>${filingData.special_expenses || 0}</special_expenses>
      <extraordinary_income>${filingData.extraordinary_income || 0}</extraordinary_income>
      <church_tax>${filingData.church_tax || 0}</church_tax>
      <insurance_contributions>${filingData.insurance_contributions || 0}</insurance_contributions>
    </deductions>
    <attachments>
      ${generateAttachmentXML(filingData.attachments || [])}
    </attachments>
  </form_e1>
</declaration>`;

  return declaration;
}

function generateAttachmentXML(attachments) {
  return attachments.map((att, i) => `
    <attachment id="att_${i}">
      <type>${att.type || 'other'}</type>
      <reference>${att.reference || ''}</reference>
      <amount>${att.amount || 0}</amount>
    </attachment>`).join('\n');
}
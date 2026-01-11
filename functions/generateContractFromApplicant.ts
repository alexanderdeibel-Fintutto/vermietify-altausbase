import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { applicant_id, template_id, move_in_date, monthly_rent, deposit_amount } = await req.json();

    const applicant = await base44.asServiceRole.entities.Applicant.read(applicant_id);
    const unit = await base44.asServiceRole.entities.Unit.read(applicant.unit_id);
    const template = await base44.asServiceRole.entities.DocumentTemplate.read(template_id);

    // Replace template placeholders
    let contractContent = template.content
      .replace(/{{tenant_name}}/g, `${applicant.first_name} ${applicant.last_name}`)
      .replace(/{{tenant_email}}/g, applicant.email)
      .replace(/{{unit_address}}/g, unit.address || 'N/A')
      .replace(/{{monthly_rent}}/g, monthly_rent)
      .replace(/{{deposit_amount}}/g, deposit_amount)
      .replace(/{{move_in_date}}/g, move_in_date)
      .replace(/{{contract_date}}/g, new Date().toLocaleDateString('de-DE'));

    // Create contract document
    const document = await base44.asServiceRole.entities.Document.create({
      company_id: applicant.company_id,
      name: `Mietvertrag - ${applicant.first_name} ${applicant.last_name}`,
      content: contractContent,
      type: 'contract',
      tags: ['mietvertrag', 'neu'],
      status: 'draft',
      metadata: {
        applicant_id,
        unit_id: applicant.unit_id,
        monthly_rent,
        deposit_amount,
        move_in_date
      }
    });

    return Response.json({ 
      success: true, 
      document_id: document.id,
      contract_content: contractContent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
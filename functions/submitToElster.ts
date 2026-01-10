import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, forms = [] } = await req.json();

  const submissions = [];

  for (const formType of forms) {
    const submission = await base44.entities.ElsterSubmission.create({
      form_type: formType,
      tax_year: year,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: user.email,
      transfer_ticket: `TT${Date.now()}`,
      elster_id: `ELSTER-${Date.now()}-${formType}`
    });
    
    submissions.push(submission);
  }

  return Response.json({
    success: true,
    submissions: submissions.length,
    transfer_tickets: submissions.map(s => s.transfer_ticket)
  });
});
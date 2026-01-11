import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id } = await req.json();
    const document = await base44.asServiceRole.entities.Document.read(document_id);
    const applicant = await base44.asServiceRole.entities.Applicant.read(document.metadata.applicant_id);

    // Create signature request
    const signatureRequest = await base44.asServiceRole.entities.SignatureRequest.create({
      document_id,
      company_id: document.company_id,
      signatories: [
        {
          email: applicant.email,
          name: `${applicant.first_name} ${applicant.last_name}`,
          status: 'pending'
        },
        {
          email: user.email,
          name: user.full_name,
          status: 'pending'
        }
      ],
      status: 'pending',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Send email to tenant
    await base44.integrations.Core.SendEmail({
      to: applicant.email,
      subject: 'Mietvertrag zur Unterschrift',
      body: `Sehr geehrte/r ${applicant.first_name} ${applicant.last_name},

herzlichen Glückwunsch! Ihr Mietvertrag ist bereit zur Unterschrift.

Bitte loggen Sie sich im Mieterportal ein, um den Vertrag zu signieren.

Mit freundlichen Grüßen`
    });

    await base44.asServiceRole.entities.Document.update(document_id, {
      status: 'pending_signature'
    });

    return Response.json({ 
      success: true, 
      signature_request_id: signatureRequest.id 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
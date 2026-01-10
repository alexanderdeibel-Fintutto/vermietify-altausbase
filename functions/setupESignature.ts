import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, signatories, company_id } = await req.json();

    // Create signature request
    const doc = await base44.asServiceRole.entities.Document.read(document_id);

    const sigRequest = await base44.asServiceRole.entities.SignatureRequest.create({
      document_id,
      company_id,
      signatories: signatories.map(s => ({
        email: s.email,
        name: s.name,
        status: 'pending'
      })),
      created_by: user.email,
      status: 'pending',
      document_name: doc.name
    });

    // Send notifications to signatories
    for (const signatory of signatories) {
      await base44.integrations.Core.SendEmail({
        to: signatory.email,
        subject: `Signaturanfrage: ${doc.name}`,
        body: `Bitte signieren Sie das Dokument "${doc.name}". Klicken Sie auf den Link: https://app.example.com/sign/${sigRequest.id}`
      });
    }

    return Response.json({ success: true, signature_request: sigRequest });
  } catch (error) {
    console.error('E-Signature error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
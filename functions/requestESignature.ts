import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { document_id } = await req.json();

  const doc = (await base44.entities.Document.filter({ id: document_id }))[0];

  await base44.entities.DocumentSignature.create({
    document_id,
    signer_email: user.email,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  await base44.integrations.Core.SendEmail({
    to: user.email,
    subject: 'Signaturanfrage für ' + doc.name,
    body: 'Bitte signieren Sie das Dokument.'
  });

  return Response.json({ success: true });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signatures = await base44.entities.DocumentSignature.filter(
    { status: 'pending' },
    '-created_date',
    10
  );

  const enriched = await Promise.all(signatures.map(async (sig) => {
    const doc = (await base44.entities.Document.filter({ id: sig.document_id }))[0];
    return {
      id: sig.id,
      document_name: doc?.name || 'Unbekanntes Dokument',
      signer_email: sig.signer_email,
      signed: sig.status === 'signed'
    };
  }));

  return Response.json({ signatures: enriched });
});
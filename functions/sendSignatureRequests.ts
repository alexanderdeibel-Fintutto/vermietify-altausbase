import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature_request_id, signers, document_url, message } = await req.json();

    // Get app URL for signing links
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.example.com';
    const signingBaseUrl = `${appUrl}/sign`;

    // Send emails to each signer
    const sendPromises = signers.map(signer =>
      base44.integrations.Core.SendEmail({
        to: signer.email,
        subject: '📄 Signaturanfrage erhalten',
        body: `
Hallo ${signer.name},

Sie haben eine Signaturanfrage erhalten.

Dokument: ${document_url}

${message ? `Nachricht: ${message}` : ''}

Zum Signieren klicken Sie hier:
${signingBaseUrl}?request_id=${signature_request_id}&signer_email=${encodeURIComponent(signer.email)}

Gültig bis: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}

Viele Grüße,
Dein ${Deno.env.get('BASE44_APP_NAME') || 'Document Management'} Team
        `
      })
    );

    await Promise.all(sendPromises);

    // Log audit entry
    const requests = await base44.entities.SignatureRequest.filter({
      id: signature_request_id
    });

    if (requests.length > 0) {
      const request = requests[0];
      const updatedAuditTrail = [
        ...request.audit_trail,
        {
          action: 'sent',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Signaturanfragen an ${signers.length} Unterzeichner versendet`
        }
      ];

      await base44.entities.SignatureRequest.update(signature_request_id, {
        status: 'sent',
        audit_trail: updatedAuditTrail
      });
    }

    return Response.json({ success: true, sent: signers.length });
  } catch (error) {
    console.error('Error sending signature requests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
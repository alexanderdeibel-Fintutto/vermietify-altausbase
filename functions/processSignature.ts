import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { signature_request_id, signer_email, signature_data } = await req.json();

    const base44 = createClientFromRequest(req);

    // Get signature request
    const requests = await base44.asServiceRole.entities.SignatureRequest.filter({
      id: signature_request_id
    });

    if (requests.length === 0) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    const request = requests[0];

    // Update signer status
    const updatedSigners = request.signers.map(s => {
      if (s.email === signer_email) {
        return {
          ...s,
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: signer_email,
          signature_url: signature_data.url
        };
      }
      return s;
    });

    // Update audit trail
    const updatedAuditTrail = [
      ...request.audit_trail,
      {
        action: 'signed',
        actor: signer_email,
        timestamp: new Date().toISOString(),
        details: `Dokument signiert von ${signer_email}`
      }
    ];

    // Check if all signed
    const allSigned = updatedSigners.every(s => s.status === 'signed');
    const newStatus = allSigned ? 'completed' : 'in_progress';

    // Update request
    await base44.asServiceRole.entities.SignatureRequest.update(signature_request_id, {
      signers: updatedSigners,
      audit_trail: updatedAuditTrail,
      status: newStatus,
      ...(allSigned && {
        signed_document_url: signature_data.combined_url
      })
    });

    // If all signed, notify initiator
    if (allSigned) {
      await base44.integrations.Core.SendEmail({
        to: request.initiator_email,
        subject: '✅ Dokument vollständig signiert',
        body: `Alle Unterzeichner haben das Dokument "${request.document_name}" signiert. Sie können es jetzt herunterladen.`
      });

      // Send Slack notification
      try {
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: '#documents',
            text: `✅ Dokument signiert: ${request.document_name}`,
            blocks: [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Dokument vollständig signiert*\n*Dokument:* ${request.document_name}\n*Von:* ${request.initiator_name}`
              }
            }]
          })
        });
      } catch (error) {
        console.log('Slack notification optional, continuing');
      }
    }

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error processing signature:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
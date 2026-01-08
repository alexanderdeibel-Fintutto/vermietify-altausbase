import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const payload = await req.json();
    const signature = req.headers.get('x-webhook-signature');

    console.log('[WEBHOOK] Event:', payload.event_type);

    // Validate webhook signature (würde in Realität echte Validierung sein)
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    if (!signature || signature !== expectedSecret) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (payload.event_type) {
      case 'submission.accepted':
        // Aktualisiere Submission Status
        if (payload.submission_id) {
          await base44.asServiceRole.entities.ElsterSubmission.update(
            payload.submission_id,
            {
              status: 'ACCEPTED',
              elster_response: payload.data
            }
          );

          // Trigger notification
          await base44.functions.invoke('notifyElsterStatusChange', {
            submission_id: payload.submission_id,
            new_status: 'ACCEPTED'
          });
        }
        break;

      case 'submission.rejected':
        await base44.asServiceRole.entities.ElsterSubmission.update(
          payload.submission_id,
          {
            status: 'REJECTED',
            validation_errors: payload.errors || [],
            elster_response: payload.data
          }
        );
        break;

      case 'certificate.expiring':
        // Warnung dass Zertifikat bald abläuft
        await base44.integrations.Core.SendEmail({
          to: payload.admin_email,
          subject: '⚠️ ELSTER-Zertifikat läuft bald ab',
          body: `Ihr Zertifikat für ${payload.tax_number} läuft am ${payload.expires_at} ab.`
        });
        break;
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
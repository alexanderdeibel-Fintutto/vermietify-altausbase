import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { submission_id, old_status, new_status } = await req.json();

    console.log(`[NOTIFY] Status change: ${old_status} -> ${new_status} for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submission || submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    const messages = {
      'VALIDATED': {
        title: '✅ ELSTER-Formular validiert',
        message: `${sub.tax_form_type} für ${sub.tax_year} ist validiert und bereit zur Übermittlung.`,
        type: 'success'
      },
      'SUBMITTED': {
        title: '📤 ELSTER-Übermittlung gestartet',
        message: `${sub.tax_form_type} für ${sub.tax_year} wurde an ELSTER übermittelt.`,
        type: 'info'
      },
      'ACCEPTED': {
        title: '🎉 ELSTER-Übermittlung akzeptiert',
        message: `${sub.tax_form_type} für ${sub.tax_year} wurde von ELSTER akzeptiert!`,
        type: 'success'
      },
      'REJECTED': {
        title: '❌ ELSTER-Übermittlung abgelehnt',
        message: `${sub.tax_form_type} für ${sub.tax_year} wurde abgelehnt. Bitte prüfen.`,
        type: 'error'
      },
      'ARCHIVED': {
        title: '📦 ELSTER-Formular archiviert',
        message: `${sub.tax_form_type} für ${sub.tax_year} wurde GoBD-konform archiviert.`,
        type: 'info'
      }
    };

    const notification = messages[new_status];
    if (!notification) {
      console.log('[SKIP] No notification for status:', new_status);
      return Response.json({ success: true, notified: false });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: sub.created_by,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: '/ElsterIntegration',
      is_read: false,
      metadata: {
        submission_id: sub.id,
        form_type: sub.tax_form_type,
        tax_year: sub.tax_year
      }
    });

    console.log('[SUCCESS] Notification created');

    return Response.json({
      success: true,
      notified: true,
      notification_type: notification.type
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
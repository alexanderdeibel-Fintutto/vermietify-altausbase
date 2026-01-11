import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active expiries
    const expiries = await base44.asServiceRole.entities.DocumentExpiry.filter({
      status: 'active'
    });

    const today = new Date();
    const notifications = [];

    for (const expiry of expiries) {
      const expiryDate = new Date(expiry.expiry_date);
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

      // Check if reminder needed
      const needsReminder = expiry.reminder_days.includes(daysUntilExpiry);
      const alreadyNotified = expiry.notified_dates?.includes(daysUntilExpiry.toString());

      if (needsReminder && !alreadyNotified) {
        const doc = await base44.asServiceRole.entities.Document.read(expiry.document_id);

        // Send notification
        await base44.integrations.Core.SendEmail({
          to: doc.created_by,
          subject: `Dokumentablauf: ${doc.name}`,
          body: `Das Dokument "${doc.name}" läuft in ${daysUntilExpiry} Tagen ab.`
        });

        // Update notified dates
        const notifiedDates = [...(expiry.notified_dates || []), daysUntilExpiry.toString()];
        await base44.asServiceRole.entities.DocumentExpiry.update(expiry.id, {
          notified_dates: notifiedDates
        });

        notifications.push({ document_id: expiry.document_id, days: daysUntilExpiry });
      }

      // Update status
      if (daysUntilExpiry <= 7 && expiry.status === 'active') {
        await base44.asServiceRole.entities.DocumentExpiry.update(expiry.id, {
          status: 'expiring_soon'
        });
      } else if (daysUntilExpiry < 0 && expiry.status !== 'expired') {
        await base44.asServiceRole.entities.DocumentExpiry.update(expiry.id, {
          status: 'expired'
        });

        // Trigger auto-renewal if enabled
        if (expiry.auto_renew && expiry.renewal_workflow_id) {
          await base44.asServiceRole.entities.WorkflowExecution.create({
            workflow_id: expiry.renewal_workflow_id,
            company_id: expiry.company_id,
            status: 'running',
            started_by: 'system',
            started_at: new Date().toISOString(),
            variables: { document_id: expiry.document_id }
          });
        }
      }
    }

    return Response.json({ success: true, notifications_sent: notifications.length });
  } catch (error) {
    console.error('Expiry tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
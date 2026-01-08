import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, reminder_type, days_before = 7 } = await req.json();

    if (!submission_id || !reminder_type) {
      return Response.json({ 
        error: 'submission_id and reminder_type required' 
      }, { status: 400 });
    }

    console.log(`[SMART-REMINDER] Setting ${reminder_type} for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    
    // Berechne Deadline basierend auf Steuerformular und Jahr
    const deadlines = {
      ANLAGE_V: { month: 4, day: 30 }, // 30. April
      EUER: { month: 4, day: 30 },
      UMSATZSTEUER: { month: 4, day: 30 },
      GEWERBESTEUER: { month: 4, day: 30 }
    };

    const deadline = deadlines[sub.tax_form_type];
    if (!deadline) {
      return Response.json({ error: 'Unknown form type for deadline calculation' }, { status: 400 });
    }

    const deadlineDate = new Date(sub.tax_year + 1, deadline.month - 1, deadline.day);
    const reminderDate = new Date(deadlineDate);
    reminderDate.setDate(reminderDate.getDate() - days_before);

    // Erstelle Benachrichtigung
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      title: `ELSTER-Erinnerung: ${sub.tax_form_type}`,
      message: `Ihre ${sub.tax_form_type} für ${sub.tax_year} ist in ${days_before} Tagen fällig (${deadlineDate.toLocaleDateString('de-DE')})`,
      type: 'reminder',
      category: 'elster',
      priority: days_before <= 3 ? 'high' : 'medium',
      scheduled_for: reminderDate.toISOString(),
      metadata: {
        submission_id: sub.id,
        deadline: deadlineDate.toISOString(),
        form_type: sub.tax_form_type
      }
    });

    console.log(`[SMART-REMINDER] Created for ${reminderDate.toLocaleDateString('de-DE')}`);

    return Response.json({
      success: true,
      notification_id: notification.id,
      scheduled_for: reminderDate.toISOString(),
      deadline: deadlineDate.toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
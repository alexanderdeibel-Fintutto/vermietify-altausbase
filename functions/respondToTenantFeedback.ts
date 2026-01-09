import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { feedback_id, response } = await req.json();

    if (!feedback_id || !response) {
      return Response.json({ error: 'feedback_id and response required' }, { status: 400 });
    }

    // Get the feedback
    const feedbacks = await base44.asServiceRole.entities.TenantFeedback.filter({ id: feedback_id }, null, 1);
    const feedback = feedbacks[0];

    if (!feedback) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Update feedback with response
    await base44.asServiceRole.entities.TenantFeedback.update(feedback_id, {
      admin_response: response,
      responded_by: user.email,
      responded_at: new Date().toISOString(),
      status: 'responded'
    });

    // Send email notification to tenant
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: feedback.tenant_email,
        subject: `Antwort auf Ihr Feedback: ${feedback.subject || 'Ihr Anliegen'}`,
        body: `Hallo ${feedback.tenant_name},\n\nvielen Dank für Ihr Feedback. Wir haben uns Ihr Anliegen angesehen und möchten wie folgt antworten:\n\n${response}\n\nBei weiteren Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\nIhr Verwaltungsteam`,
        from_name: 'Verwaltung'
      });
    } catch (emailError) {
      console.warn('Failed to send email notification:', emailError);
    }

    return Response.json({
      success: true,
      feedback_id,
      response
    });

  } catch (error) {
    console.error('Error responding to feedback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
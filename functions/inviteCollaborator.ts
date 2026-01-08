import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, email, role } = await req.json();

    // Sende Einladungs-E-Mail
    await base44.integrations.Core.SendEmail({
      from_name: 'ImmoVerwalter',
      to: email,
      subject: `Einladung zur Zusammenarbeit an ELSTER-Einreichung`,
      body: `
        <h2>Einladung zur Zusammenarbeit</h2>
        <p>Hallo,</p>
        <p>${user.full_name} hat Sie eingeladen, an einer ELSTER-Einreichung zusammenzuarbeiten.</p>
        <p><strong>Ihre Rolle:</strong> ${role}</p>
        <p><a href="${Deno.env.get('BASE_URL')}/submissions/${submission_id}">Zur Einreichung</a></p>
        <p>Mit freundlichen Grüßen<br>Ihr ImmoVerwalter Team</p>
      `
    });

    // Log activity
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'invite_collaborator',
      details: {
        invited_email: email,
        role,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      message: `Einladung an ${email} gesendet`
    });

  } catch (error) {
    console.error('Invite Collaborator Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
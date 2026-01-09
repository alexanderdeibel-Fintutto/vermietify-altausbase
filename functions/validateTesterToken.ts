import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return Response.json({ 
        valid: false, 
        status: 'invalid',
        error: 'Token erforderlich' 
      }, { status: 400 });
    }

    // Get Base44 client with request context
    const base44 = createClientFromRequest(req);

    // Find invitation by token
    const invitations = await base44.entities.TesterInvitation.filter({
      invitation_token: token
    });

    if (!invitations || invitations.length === 0) {
      return Response.json({
        valid: false,
        status: 'invalid',
        error: 'Einladungs-Token nicht gefunden'
      });
    }

    const invitation = invitations[0];

    // Check status
    if (invitation.status === 'accepted') {
      return Response.json({
        valid: false,
        status: 'already_accepted',
        error: 'Dieser Test-Account wurde bereits aktiviert'
      });
    }

    if (invitation.status === 'revoked') {
      return Response.json({
        valid: false,
        status: 'revoked',
        error: 'Diese Einladung wurde zurückgezogen'
      });
    }

    // Check expiration
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return Response.json({
        valid: false,
        status: 'expired',
        error: 'Einladungs-Token ist abgelaufen'
      });
    }

    // Valid token
    return Response.json({
      valid: true,
      status: 'pending',
      invitation: {
        id: invitation.id,
        tester_name: invitation.tester_name,
        invited_email: invitation.invited_email,
        invitation_type: invitation.invitation_type,
        custom_message: invitation.custom_message,
        expires_at: invitation.expires_at,
        assigned_projects: invitation.assigned_projects
      }
    });
  } catch (error) {
    return Response.json({
      valid: false,
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});
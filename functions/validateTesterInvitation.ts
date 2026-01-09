import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token erforderlich' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Invitation suchen
    const invitations = await base44.asServiceRole.entities.TesterInvitation.filter(
      { invitation_token: token },
      '',
      1
    );

    if (!invitations || invitations.length === 0) {
      return Response.json({ error: 'Token ungültig' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Status prüfen
    if (invitation.status === 'expired') {
      return Response.json({ error: 'Einladung abgelaufen' }, { status: 400 });
    }

    if (invitation.status === 'revoked') {
      return Response.json({ error: 'Einladung widerrufen' }, { status: 400 });
    }

    if (invitation.status === 'accepted') {
      return Response.json({ error: 'Einladung bereits angenommen' }, { status: 400 });
    }

    // Ablaufzeit prüfen
    if (new Date(invitation.expires_at) < new Date()) {
      // Markiere als abgelaufen
      await base44.asServiceRole.entities.TesterInvitation.update(invitation.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Einladung abgelaufen' }, { status: 400 });
    }

    return Response.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.invitation_token,
        tester_name: invitation.tester_name,
        invited_email: invitation.invited_email,
        expires_at: invitation.expires_at,
        custom_message: invitation.custom_message
      }
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
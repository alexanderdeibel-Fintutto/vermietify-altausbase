import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
    }

    const { tester_name, invited_email, custom_message, assigned_projects } = await req.json();

    // Validierung
    if (!tester_name || !invited_email) {
      return Response.json({ error: 'Name und E-Mail erforderlich' }, { status: 400 });
    }

    // Token generieren
    const tokenArray = crypto.getRandomValues(new Uint8Array(32));
    const invitation_token = Array.from(tokenArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Expires_at auf 2 Wochen setzen
    const expires_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Einladung in DB speichern
    const invitation = await base44.asServiceRole.entities.TesterInvitation.create({
      invitation_token,
      invited_by: user.email,
      invited_email,
      tester_name,
      custom_message: custom_message || getDefaultMessage(tester_name),
      expires_at,
      status: 'pending',
      assigned_projects: assigned_projects || [],
      resend_count: 0
    });

    // Einladungslink generieren
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:3000';
    const invitationLink = `${appBaseUrl}/tester-accept-invitation?token=${invitation_token}`;

    // E-Mail versenden
    const emailBody = custom_message || getDefaultMessage(tester_name);
    const emailHtml = `
      <h2>Willkommen zum App-Test! 🎉</h2>
      <p>${emailBody.replace(/\n/g, '<br>')}</p>
      <p><strong>Dein Zugangslink:</strong></p>
      <p><a href="${invitationLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Zum Test-Zugang</a></p>
      <p><small>Dieser Link ist gültig bis ${new Date(expires_at).toLocaleDateString('de-DE')}</small></p>
    `;

    await base44.integrations.Core.SendEmail({
      to: invited_email,
      subject: `${tester_name}, hier ist dein Test-Zugang! 🚀`,
      body: emailHtml
    });

    console.log(`Einladung versendet an ${invited_email}`);

    return Response.json({
      success: true,
      invitation_id: invitation.id,
      token: invitation_token,
      expires_at,
      message: `Einladung versendet an ${invited_email}`
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDefaultMessage(testerName) {
  return `Hallo ${testerName}!

ich hoffe, dir geht's gut! 🙂
Wie versprochen, hier dein Zugang zu unserer neuen Immobilienverwaltungs-App. Ich freue mich sehr auf dein Feedback!

Was dich erwartet:
* Eine komplette Immobilienverwaltung mit allen Funktionen
* Du kannst alles ausprobieren (keine echten Daten!)
* Falls was nicht funktioniert: Einfach auf den "Problem melden" Button klicken

Der Link ist 2 Wochen gültig. Falls du Fragen hast, ruf mich einfach an oder schreib mir!

Vielen Dank, dass du dir die Zeit nimmst!
Liebe Grüße
Alexander

PS: Ich bin gespannt auf deine ehrliche Meinung! 😊`;
}
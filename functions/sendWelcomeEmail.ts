import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, user_type } = body;
    
    const subject = 'Willkommen bei vermitify! 🏠';
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Raleway', Arial, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #E2E8F0; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .features { margin: 20px 0; }
    .feature { padding: 12px; margin: 8px 0; background: #F8FAFC; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #94A3B8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">vermitify</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Ihre Immobilien verwalten sich von selbst</p>
    </div>
    
    <div class="content">
      <h2>Willkommen, ${name || 'Vermieter'}! 👋</h2>
      
      <p>Schön, dass Sie da sind! Sie haben den ersten Schritt zu einer professionellen Immobilienverwaltung gemacht.</p>
      
      <div class="features">
        <div class="feature">
          <strong>✓ Kostenlose Tools nutzen</strong><br>
          Rendite-Rechner, AfA-Rechner, Indexmieten-Rechner - alle Tools stehen Ihnen zur Verfügung
        </div>
        <div class="feature">
          <strong>✓ Objekte anlegen</strong><br>
          Erfassen Sie Ihre Immobilien und verwalten Sie alle Daten zentral
        </div>
        <div class="feature">
          <strong>✓ Steuern optimieren</strong><br>
          Automatische Anlage V Erstellung - sparen Sie bis zu 3 Stunden pro Jahr
        </div>
      </div>
      
      <center>
        <a href="https://app.vermitify.de/dashboard" class="button">
          Jetzt durchstarten →
        </a>
      </center>
      
      <p style="margin-top: 30px; color: #64748B; font-size: 14px;">
        Bei Fragen stehen wir Ihnen jederzeit zur Verfügung:<br>
        📧 support@vermitify.de<br>
        📱 +49 30 1234 5678
      </p>
    </div>
    
    <div class="footer">
      vermitify GmbH • Musterstraße 1 • 10115 Berlin<br>
      <a href="#" style="color: #94A3B8;">Abmelden</a>
    </div>
  </div>
</body>
</html>
    `;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body: htmlBody,
      from_name: 'vermitify Team'
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
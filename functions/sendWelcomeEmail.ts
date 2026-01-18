import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, name } = await req.json();

    if (!email) {
      return Response.json({ error: 'E-Mail erforderlich' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Willkommen bei Vermitify! 🏠',
      from_name: 'Vermitify Team',
      body: `Hallo ${name || ''},

Herzlich willkommen bei Vermitify!

Wir freuen uns, dass Sie sich für unsere Plattform entschieden haben.

Hier sind Ihre ersten Schritte:
1. Profil vervollständigen
2. Erstes Objekt anlegen
3. Einheiten erstellen
4. Mieter hinzufügen

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.

Beste Grüße
Ihr Vermitify Team

---
support@vermitify.de
+49 30 1234567`
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
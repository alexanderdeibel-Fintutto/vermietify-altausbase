import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { name, email, company, message, category } = payload;

    // Send email to sales team
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Vermitify Website',
      to: 'sales@vermitify.de',
      subject: `[Kontaktanfrage] ${category || 'Allgemein'} - ${name}`,
      body: `
Neue Kontaktanfrage über die Website:

Name: ${name}
E-Mail: ${email}
Firma: ${company || '-'}
Kategorie: ${category || 'Allgemein'}

Nachricht:
${message}

---
Gesendet am: ${new Date().toLocaleString('de-DE')}
      `
    });

    // Send confirmation to customer
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Vermitify',
      to: email,
      subject: 'Ihre Anfrage bei Vermitify',
      body: `
Hallo ${name},

vielen Dank für Ihre Anfrage!

Wir haben Ihre Nachricht erhalten und werden uns schnellstmöglich bei Ihnen melden.

Beste Grüße
Ihr Vermitify Team

---
Dies ist eine automatische Bestätigung.
      `
    });

    return Response.json({ 
      success: true,
      message: 'Anfrage erfolgreich gesendet'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
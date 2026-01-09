import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, tenant_email, tenant_name, portal_access_token } = await req.json();

    if (!tenant_email || !tenant_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate portal access link
    const portalLink = `${Deno.env.get('APP_URL') || 'https://app.base44.dev'}/tenant-portal?token=${portal_access_token}`;

    // Send welcome email via Core integration
    const emailResult = await base44.integrations.Core.SendEmail({
      to: tenant_email,
      subject: 'Willkommen in unserem Mieterportal',
      body: `
Hallo ${tenant_name},

herzlich willkommen! Wir freuen uns, Sie als neuen Mieter begrüßen zu dürfen.

**Ihr Mieterportal ist bereit:**
Greifen Sie auf Ihr persönliches Mieterportal zu, um:
- Ihre Mietverträge einzusehen
- Zahlungen zu verwalten
- Wartungsanfragen zu stellen
- Mit unserem Team zu kommunizieren

**Zum Portal:**
${portalLink}

**Ihr Zugriffstoken:**
${portal_access_token}

Falls Sie Fragen haben, kontaktieren Sie uns gerne jederzeit.

Viele Grüße,
Ihr Verwaltungsteam
      `,
      from_name: 'Verwaltung'
    });

    return Response.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      portal_link: portalLink
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
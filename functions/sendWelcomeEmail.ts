import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, full_name, type = 'lead' } = await req.json();

        if (!email) {
            return Response.json({ error: 'Email ist erforderlich' }, { status: 400 });
        }

        let subject = '';
        let body = '';

        if (type === 'lead') {
            subject = 'Willkommen bei Vermitify - Ihre Immobilienverwaltung';
            body = `Hallo ${full_name || ''},

vielen Dank für Ihr Interesse an Vermitify!

Wir haben Ihre Anfrage erhalten und freuen uns, Sie auf Ihrem Weg zur professionellen Immobilienverwaltung zu begleiten.

**Was Sie als Nächstes erwartet:**
• Zugang zu unseren kostenlosen Rechnern und Tools
• Persönliche Beratung durch unser Team
• Exklusive Einblicke in Best Practices

Haben Sie Fragen? Antworten Sie einfach auf diese Email.

Beste Grüße,
Ihr Vermitify Team

---
Vermitify - Immobilienverwaltung leicht gemacht`;
        } else if (type === 'user') {
            subject = 'Willkommen bei Vermitify - Ihr Account ist bereit!';
            body = `Hallo ${full_name || ''},

herzlich willkommen bei Vermitify!

Ihr Account wurde erfolgreich erstellt. Sie können sich jetzt einloggen und mit der Verwaltung Ihrer Immobilien beginnen.

**Erste Schritte:**
1. Vervollständigen Sie Ihr Profil
2. Legen Sie Ihr erstes Gebäude an
3. Laden Sie Ihre Mieter ein

Unser Onboarding-Wizard hilft Ihnen bei jedem Schritt.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Beste Grüße,
Ihr Vermitify Team`;
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Vermitify',
            to: email,
            subject,
            body
        });

        return Response.json({ success: true, message: 'Email versendet' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, full_name, phone, company, message, subject } = await req.json();

        if (!email || !message) {
            return Response.json({ error: 'Email und Nachricht sind erforderlich' }, { status: 400 });
        }

        // Capture as lead
        const leads = await base44.asServiceRole.entities.Lead.filter({ email });
        
        if (leads.length === 0) {
            await base44.asServiceRole.entities.Lead.create({
                email,
                full_name,
                phone,
                company,
                source: 'contact_form',
                lead_score: 15,
                status: 'new',
                last_activity_date: new Date().toISOString()
            });
        } else {
            await base44.asServiceRole.entities.Lead.update(leads[0].id, {
                lead_score: (leads[0].lead_score || 0) + 10,
                last_activity_date: new Date().toISOString()
            });
        }

        // Send notification to admin
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        
        for (const admin of admins) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: admin.email,
                subject: `Neue Kontaktanfrage: ${subject || 'Allgemeine Anfrage'}`,
                body: `Neue Kontaktanfrage von ${full_name || email}:

Email: ${email}
Telefon: ${phone || 'Nicht angegeben'}
Firma: ${company || 'Nicht angegeben'}

Nachricht:
${message}

Lead-Score: ${leads.length > 0 ? leads[0].lead_score + 10 : 15}
`
            });
        }

        // Send confirmation to user
        await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Vermitify',
            to: email,
            subject: 'Ihre Anfrage bei Vermitify',
            body: `Hallo ${full_name || ''},

vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.

Beste Grüße,
Ihr Vermitify Team`
        });

        return Response.json({ success: true, message: 'Kontaktanfrage versendet' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
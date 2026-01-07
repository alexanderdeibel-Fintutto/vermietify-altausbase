import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_account_id, kontakt_ids } = await req.json();

        const account = await base44.entities.WhatsAppAccount.filter({ id: whatsapp_account_id });
        if (!account || account.length === 0) {
            return Response.json({ error: 'Account nicht gefunden' }, { status: 404 });
        }

        let versendet = 0;
        let fehler = 0;
        let ohne_email = 0;

        for (const kontakt_id of kontakt_ids) {
            const contacts = await base44.entities.WhatsAppContact.filter({ id: kontakt_id });
            if (contacts.length === 0) continue;
            
            const kontakt = contacts[0];
            let email = null;

            // Hole E-Mail-Adresse
            if (kontakt.kontakt_typ === 'mieter' && kontakt.tenant_id) {
                const tenants = await base44.entities.Tenant.filter({ id: kontakt.tenant_id });
                if (tenants.length > 0) email = tenants[0].email;
            } else if (kontakt.kontakt_typ === 'eigentuemer' && kontakt.owner_id) {
                const owners = await base44.entities.Owner.filter({ id: kontakt.owner_id });
                if (owners.length > 0) {
                    email = owners[0].email_privat || owners[0].email_geschaeftlich;
                }
            }

            if (!email) {
                ohne_email++;
                continue;
            }

            // Generiere Token
            const opt_in_token = crypto.randomUUID();
            await base44.asServiceRole.entities.WhatsAppContact.update(kontakt.id, {
                opt_in_token
            });

            const opt_in_url = `https://${Deno.env.get('BASE44_APP_ID')}.base44.cloud/opt-in/${opt_in_token}`;

            try {
                await base44.integrations.Core.SendEmail({
                    to: email,
                    subject: 'WhatsApp-Einwilligung für Hausverwaltung',
                    body: `Guten Tag ${kontakt.name},\n\nwir möchten Ihnen künftig wichtige Informationen auch per WhatsApp zusenden.\n\n✅ Einwilligung erteilen: ${opt_in_url}\n\nMit freundlichen Grüßen\n${user.full_name}`
                });
                versendet++;
            } catch (e) {
                fehler++;
                console.error('Email send error:', e);
            }
        }

        return Response.json({
            success: true,
            versendet,
            fehler,
            ohne_email
        });

    } catch (error) {
        console.error('WhatsApp send opt-in email error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const { token } = await req.json();

        // Suche Kontakt mit Token
        const contacts = await base44.asServiceRole.entities.WhatsAppContact.filter({
            opt_in_token: token
        });

        if (contacts.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Ungültiger Token' 
            }, { status: 404 });
        }

        const kontakt = contacts[0];

        // Update Kontakt
        await base44.asServiceRole.entities.WhatsAppContact.update(kontakt.id, {
            opt_in_status: 'erteilt',
            opt_in_datum: new Date().toISOString(),
            opt_in_methode: 'online_formular'
        });

        // Erstelle Opt-In Eintrag
        const account = await base44.asServiceRole.entities.WhatsAppAccount.filter({ 
            id: kontakt.whatsapp_account_id 
        });
        
        await base44.asServiceRole.entities.WhatsAppOptIn.create({
            whatsapp_contact_id: kontakt.id,
            status: 'erteilt',
            methode: 'online_formular',
            ip_adresse: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            bestaetigung_text: 'Einwilligung erteilt via Online-Formular',
            erteilt_am: new Date().toISOString(),
            created_by_user_id: account[0].user_id
        });

        return Response.json({
            success: true,
            message: 'Vielen Dank! Sie erhalten ab jetzt Nachrichten per WhatsApp.'
        });

    } catch (error) {
        console.error('WhatsApp confirm opt-in error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
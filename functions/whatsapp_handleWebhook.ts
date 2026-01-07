import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const payload = await req.json();
        
        // Log webhook
        await base44.asServiceRole.entities.WhatsAppWebhookLog.create({
            webhook_typ: payload.event_type === 'message.received' ? 'message' : 'status',
            payload: payload,
            signatur_valid: true,
            verarbeitet: false
        });

        if (payload.event_type === 'message.received') {
            // Finde Account
            const accounts = await base44.asServiceRole.entities.WhatsAppAccount.filter({
                account_id: payload.account_id
            });
            
            if (accounts.length === 0) {
                return Response.json({ success: false, error: 'Account nicht gefunden' });
            }
            const account = accounts[0];

            // Finde oder erstelle Kontakt
            let contacts = await base44.asServiceRole.entities.WhatsAppContact.filter({
                whatsapp_account_id: account.id,
                telefonnummer: payload.message.from
            });

            let kontakt;
            if (contacts.length === 0) {
                kontakt = await base44.asServiceRole.entities.WhatsAppContact.create({
                    whatsapp_account_id: account.id,
                    kontakt_typ: 'sonstige',
                    telefonnummer: payload.message.from,
                    name: payload.message.from,
                    opt_in_status: 'erteilt',
                    opt_in_datum: new Date().toISOString(),
                    opt_in_methode: 'initial_nachricht',
                    ungelesene_nachrichten: 1,
                    gesperrt: false,
                    letzter_kontakt: new Date().toISOString()
                });

                // Erstelle Opt-In Eintrag
                await base44.asServiceRole.entities.WhatsAppOptIn.create({
                    whatsapp_contact_id: kontakt.id,
                    status: 'erteilt',
                    methode: 'initial_nachricht',
                    bestaetigung_text: 'Kontakt hat zuerst geschrieben (implizite Einwilligung)',
                    erteilt_am: new Date().toISOString(),
                    created_by_user_id: account.user_id
                });
            } else {
                kontakt = contacts[0];
                await base44.asServiceRole.entities.WhatsAppContact.update(kontakt.id, {
                    ungelesene_nachrichten: kontakt.ungelesene_nachrichten + 1,
                    letzter_kontakt: new Date().toISOString()
                });
            }

            // Erstelle Nachricht
            await base44.asServiceRole.entities.WhatsAppMessage.create({
                whatsapp_account_id: account.id,
                whatsapp_contact_id: kontakt.id,
                externe_nachricht_id: payload.message.id,
                richtung: 'eingehend',
                typ: 'text',
                nachricht_text: payload.message.text || '',
                kategorie: 'service',
                status: 'gelesen'
            });

            // Erstelle Notification
            await base44.asServiceRole.entities.Notification.create({
                user_id: account.user_id,
                typ: 'whatsapp_neue_nachricht',
                titel: 'Neue WhatsApp-Nachricht',
                nachricht: `${kontakt.name}: ${(payload.message.text || '').substring(0, 100)}`,
                gelesen: false,
                data: {
                    contact_id: kontakt.id,
                    kontakt_name: kontakt.name,
                    nachricht_vorschau: (payload.message.text || '').substring(0, 100)
                }
            });
        }

        return Response.json({ success: true, verarbeitet: true });

    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const payload = await req.json();
        
        // Webhook-Log erstellen
        await base44.asServiceRole.entities.WhatsAppWebhookLog.create({
            webhook_typ: payload.type || 'message',
            payload: payload,
            signatur: req.headers.get('x-webhook-signature') || '',
            signatur_valid: true,
            verarbeitet: false
        });

        // Verarbeite verschiedene Event-Typen
        if (payload.type === 'message.received') {
            const { from, text, timestamp, message_id } = payload.data;

            // Finde oder erstelle Account
            const accounts = await base44.asServiceRole.entities.WhatsAppAccount.list();
            if (accounts.length === 0) {
                return Response.json({ error: 'No WhatsApp account found' }, { status: 404 });
            }
            const account = accounts[0];

            // Finde oder erstelle Kontakt
            let kontakte = await base44.asServiceRole.entities.WhatsAppContact.filter({
                whatsapp_account_id: account.id,
                telefonnummer: from
            });

            let kontakt = kontakte[0];
            if (!kontakt) {
                kontakt = await base44.asServiceRole.entities.WhatsAppContact.create({
                    whatsapp_account_id: account.id,
                    telefonnummer: from,
                    name: from,
                    kontakt_typ: 'sonstige',
                    opt_in_status: 'erteilt',
                    opt_in_datum: new Date().toISOString(),
                    opt_in_methode: 'initial_nachricht',
                    ungelesene_nachrichten: 0,
                    gesperrt: false
                });

                // Opt-In erstellen
                await base44.asServiceRole.entities.WhatsAppOptIn.create({
                    whatsapp_contact_id: kontakt.id,
                    status: 'erteilt',
                    methode: 'initial_nachricht',
                    bestaetigung_text: 'Initiale Nachricht empfangen',
                    erteilt_am: new Date().toISOString(),
                    created_by_user_id: account.user_id
                });
            }

            // Update Kontakt
            await base44.asServiceRole.entities.WhatsAppContact.update(kontakt.id, {
                letzter_kontakt: new Date().toISOString(),
                ungelesene_nachrichten: (kontakt.ungelesene_nachrichten || 0) + 1
            });

            // Nachricht erstellen
            await base44.asServiceRole.entities.WhatsAppMessage.create({
                whatsapp_account_id: account.id,
                whatsapp_contact_id: kontakt.id,
                externe_nachricht_id: message_id,
                richtung: 'eingehend',
                typ: 'text',
                nachricht_text: text,
                kategorie: 'service',
                status: 'zugestellt',
                gesendet_am: new Date(timestamp).toISOString()
            });

            // Benachrichtigung erstellen
            await base44.asServiceRole.entities.Notification.create({
                user_id: account.user_id,
                type: 'whatsapp',
                title: `Neue WhatsApp-Nachricht von ${kontakt.name}`,
                message: text.substring(0, 100),
                link: '/whatsapp',
                is_read: false
            });
        } 
        else if (payload.type === 'message.status') {
            const { message_id, status } = payload.data;

            // Finde Nachricht und update Status
            const messages = await base44.asServiceRole.entities.WhatsAppMessage.filter({
                externe_nachricht_id: message_id
            });

            if (messages.length > 0) {
                const statusMapping = {
                    'sent': 'gesendet',
                    'delivered': 'zugestellt',
                    'read': 'gelesen',
                    'failed': 'fehler'
                };

                await base44.asServiceRole.entities.WhatsAppMessage.update(messages[0].id, {
                    status: statusMapping[status] || status,
                    [`${status}_am`]: new Date().toISOString()
                });
            }
        }

        // Markiere Webhook als verarbeitet
        const logs = await base44.asServiceRole.entities.WhatsAppWebhookLog.list('-created_date', 1);
        if (logs.length > 0) {
            await base44.asServiceRole.entities.WhatsAppWebhookLog.update(logs[0].id, {
                verarbeitet: true,
                verarbeitet_am: new Date().toISOString()
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        
        // Fehler-Log
        try {
            await base44.asServiceRole.entities.WhatsAppWebhookLog.create({
                webhook_typ: 'error',
                payload: { error: error.message },
                signatur: '',
                signatur_valid: false,
                verarbeitet: true,
                fehler: error.message
            });
        } catch (logError) {
            console.error('Failed to log webhook error:', logError);
        }

        return Response.json({ error: error.message }, { status: 500 });
    }
});
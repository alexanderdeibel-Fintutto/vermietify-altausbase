import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Nur Admins können WhatsApp einrichten' }, { status: 403 });
        }

        const { anbieter, telefonnummer, display_name, api_key, account_id } = await req.json();

        // Validiere Telefonnummer
        const phoneRegex = /^\+49[1-9][0-9]{9,13}$/;
        if (!phoneRegex.test(telefonnummer)) {
            return Response.json({ 
                error: 'Ungültige Telefonnummer. Format: +49...' 
            }, { status: 400 });
        }

        // Teste Verbindung zum Anbieter
        let testSuccess = false;
        try {
            if (anbieter === 'trengo') {
                const response = await fetch('https://api.trengo.com/v2/profile', {
                    headers: { 'Authorization': `Bearer ${api_key}` }
                });
                testSuccess = response.ok;
            } else if (anbieter === 'chatarmin') {
                const response = await fetch('https://api.chatarmin.com/v1/account', {
                    headers: { 'X-API-Key': api_key }
                });
                testSuccess = response.ok;
            } else {
                testSuccess = true; // Andere Anbieter erstmal durchlassen
            }
        } catch (error) {
            return Response.json({ 
                error: 'API-Verbindung fehlgeschlagen: ' + error.message 
            }, { status: 400 });
        }

        if (!testSuccess) {
            return Response.json({ 
                error: 'API-Zugangsdaten ungültig' 
            }, { status: 400 });
        }

        // Generiere Webhook-Secret
        const webhook_secret = crypto.randomUUID();

        // Berechne nächsten Budget-Reset (1. des Folgemonats)
        const now = new Date();
        const abrechnungs_reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Erstelle WhatsAppAccount
        const account = await base44.asServiceRole.entities.WhatsAppAccount.create({
            user_id: user.id,
            anbieter,
            telefonnummer,
            display_name: display_name || user.full_name,
            api_key,
            account_id,
            webhook_secret,
            status: 'aktiv',
            verifiziert_am: new Date().toISOString(),
            aktueller_verbrauch: 0,
            abrechnungs_reset: abrechnungs_reset.toISOString().split('T')[0]
        });

        const webhook_url = `https://${Deno.env.get('BASE44_APP_ID')}.base44.cloud/api/webhooks/whatsapp`;

        return Response.json({
            success: true,
            account_id: account.id,
            webhook_url,
            status: 'aktiv',
            message: 'WhatsApp-Account erfolgreich eingerichtet'
        });

    } catch (error) {
        console.error('WhatsApp setup error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});
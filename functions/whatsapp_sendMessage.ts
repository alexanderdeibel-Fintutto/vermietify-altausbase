import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_contact_id, nachricht_text, anhang, template_id, kategorie } = await req.json();

        // Lade Kontakt und Account
        const contact = await base44.entities.WhatsAppContact.filter({ id: whatsapp_contact_id });
        if (!contact || contact.length === 0) {
            return Response.json({ error: 'Kontakt nicht gefunden' }, { status: 404 });
        }
        const kontakt = contact[0];

        const accountData = await base44.entities.WhatsAppAccount.filter({ id: kontakt.whatsapp_account_id });
        if (!accountData || accountData.length === 0) {
            return Response.json({ error: 'WhatsApp-Account nicht gefunden' }, { status: 404 });
        }
        const account = accountData[0];

        // VALIDIERUNG
        if (kontakt.opt_in_status !== 'erteilt') {
            return Response.json({ 
                error: 'Keine Einwilligung vorhanden. Bitte Einwilligung anfordern.' 
            }, { status: 403 });
        }

        if (kontakt.gesperrt) {
            return Response.json({ 
                error: 'Kontakt ist blockiert' 
            }, { status: 403 });
        }

        // Budget prüfen
        const kosten_kategorie = {
            'service': 0.00,
            'utility': 0.0456,
            'authentication': 0.0636,
            'marketing': 0.1131
        };
        const geschaetzte_kosten = kosten_kategorie[kategorie || 'service'] || 0.0456;

        if (account.monatliches_budget && 
            (account.aktueller_verbrauch + geschaetzte_kosten) > account.monatliches_budget) {
            return Response.json({ 
                error: 'Monatliches Budget überschritten',
                warnung: true
            }, { status: 400 });
        }

        // Anhang validieren
        if (anhang && anhang.file_url) {
            const erlaubte_typen = ['pdf', 'jpeg', 'jpg', 'png', 'docx'];
            if (!erlaubte_typen.includes(anhang.typ)) {
                return Response.json({ 
                    error: `Dateityp ${anhang.typ} nicht erlaubt` 
                }, { status: 400 });
            }
        }

        // Erstelle WhatsAppMessage
        const message = await base44.asServiceRole.entities.WhatsAppMessage.create({
            whatsapp_account_id: account.id,
            whatsapp_contact_id: kontakt.id,
            document_id: anhang?.document_id || null,
            richtung: 'ausgehend',
            typ: anhang ? 'dokument' : 'text',
            nachricht_text: nachricht_text || '',
            anhang_typ: anhang?.typ || null,
            anhang_url: anhang?.file_url || null,
            anhang_dateiname: anhang?.dateiname || null,
            anhang_groesse: anhang?.groesse || null,
            kategorie: kategorie || 'service',
            status: 'gesendet',
            gesendet_am: new Date().toISOString(),
            kosten_euro: geschaetzte_kosten
        });

        // Update Account-Verbrauch
        await base44.asServiceRole.entities.WhatsAppAccount.update(account.id, {
            aktueller_verbrauch: account.aktueller_verbrauch + geschaetzte_kosten
        });

        // Update Kontakt
        await base44.asServiceRole.entities.WhatsAppContact.update(kontakt.id, {
            letzter_kontakt: new Date().toISOString()
        });

        return Response.json({
            success: true,
            message_id: message.id,
            externe_id: null,
            kosten: geschaetzte_kosten,
            status: 'gesendet'
        });

    } catch (error) {
        console.error('WhatsApp send message error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_account_id } = await req.json();

        if (!whatsapp_account_id) {
            return Response.json({ error: 'Account ID fehlt' }, { status: 400 });
        }

        // Hole Account
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Account nicht gefunden' }, { status: 404 });
        }

        const account = accounts[0];

        // Hole Nachrichten
        const nachrichten = await base44.entities.WhatsAppMessage.filter({
            whatsapp_account_id: account.id
        });

        // Hole Kontakte
        const kontakte = await base44.entities.WhatsAppContact.filter({
            whatsapp_account_id: account.id
        });

        // Hole Templates
        const templates = await base44.entities.WhatsAppTemplate.filter({
            whatsapp_account_id: account.id
        });

        // Berechne Statistiken
        const stats = {
            account: {
                status: account.status,
                telefonnummer: account.telefonnummer,
                display_name: account.display_name,
                aktueller_verbrauch: account.aktueller_verbrauch || 0,
                monatliches_budget: account.monatliches_budget || 0
            },
            nachrichten: {
                gesamt: nachrichten.length,
                gesendet: nachrichten.filter(m => m.richtung === 'ausgehend').length,
                empfangen: nachrichten.filter(m => m.richtung === 'eingehend').length,
                gelesen: nachrichten.filter(m => m.status === 'gelesen').length,
                fehler: nachrichten.filter(m => m.status === 'fehler').length,
                letzte_24h: nachrichten.filter(m => {
                    const msgDate = new Date(m.created_date);
                    const now = new Date();
                    return (now - msgDate) / (1000 * 60 * 60) < 24;
                }).length
            },
            kontakte: {
                gesamt: kontakte.length,
                mit_einwilligung: kontakte.filter(k => k.opt_in_status === 'erteilt').length,
                ohne_einwilligung: kontakte.filter(k => k.opt_in_status !== 'erteilt').length,
                ungelesen: kontakte.reduce((sum, k) => sum + (k.ungelesene_nachrichten || 0), 0),
                mieter: kontakte.filter(k => k.kontakt_typ === 'mieter').length,
                eigentuemer: kontakte.filter(k => k.kontakt_typ === 'eigentuemer').length
            },
            templates: {
                gesamt: templates.length,
                entwuerfe: templates.filter(t => t.meta_status === 'entwurf').length,
                eingereicht: templates.filter(t => t.meta_status === 'eingereicht').length,
                genehmigt: templates.filter(t => t.meta_status === 'genehmigt').length,
                abgelehnt: templates.filter(t => t.meta_status === 'abgelehnt').length
            },
            kosten: {
                gesamt: nachrichten.reduce((sum, m) => sum + (m.kosten_euro || 0), 0),
                dieser_monat: account.aktueller_verbrauch || 0,
                budget_verbleibend: (account.monatliches_budget || 0) - (account.aktueller_verbrauch || 0)
            }
        };

        return Response.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            template_id,
            whatsapp_account_id,
            template_name,
            anzeige_name,
            kategorie,
            sprache,
            body_text,
            footer_text,
            platzhalter
        } = await req.json();

        // Validierung
        if (!whatsapp_account_id || !template_name || !anzeige_name || !body_text) {
            return Response.json({ 
                error: 'Fehlende Pflichtfelder' 
            }, { status: 400 });
        }

        // Prüfe ob Account dem User gehört
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Account nicht gefunden' }, { status: 404 });
        }

        const templateData = {
            whatsapp_account_id,
            template_name,
            anzeige_name,
            kategorie: kategorie || 'utility',
            sprache: sprache || 'de',
            body_text,
            footer_text: footer_text || '',
            platzhalter: platzhalter || [],
            meta_status: 'entwurf',
            verwendungen: 0
        };

        let result;
        if (template_id) {
            // Update
            result = await base44.entities.WhatsAppTemplate.update(template_id, templateData);
        } else {
            // Create
            result = await base44.entities.WhatsAppTemplate.create(templateData);
        }

        return Response.json({
            success: true,
            template: result
        });

    } catch (error) {
        console.error('Save template error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
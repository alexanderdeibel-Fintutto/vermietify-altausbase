import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { template_id } = await req.json();

        if (!template_id) {
            return Response.json({ error: 'Template ID fehlt' }, { status: 400 });
        }

        // Hole Template
        const templates = await base44.entities.WhatsAppTemplate.filter({ id: template_id });
        if (templates.length === 0) {
            return Response.json({ error: 'Template nicht gefunden' }, { status: 404 });
        }

        const template = templates[0];

        // Hole Account
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: template.whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Keine Berechtigung' }, { status: 403 });
        }

        const account = accounts[0];

        // Simuliere API-Call zu Meta/BSP
        // In Produktion: Echter API-Call zum BSP
        const mockMetaResponse = {
            template_id: `tpl_${Date.now()}`,
            status: 'pending',
            review_time: '24-48 Stunden'
        };

        // Update Template Status
        await base44.entities.WhatsAppTemplate.update(template_id, {
            meta_status: 'eingereicht',
            meta_template_id: mockMetaResponse.template_id,
            eingereicht_am: new Date().toISOString()
        });

        // Benachrichtigung erstellen
        await base44.entities.Notification.create({
            user_id: user.id,
            type: 'whatsapp',
            title: 'Template eingereicht',
            message: `Template "${template.anzeige_name}" wurde zur Genehmigung eingereicht. Prüfung dauert ca. ${mockMetaResponse.review_time}.`,
            is_read: false
        });

        return Response.json({
            success: true,
            message: 'Template zur Genehmigung eingereicht',
            meta_response: mockMetaResponse
        });

    } catch (error) {
        console.error('Submit template error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
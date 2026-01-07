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

        // Prüfe ob Account dem User gehört
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: template.whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Keine Berechtigung' }, { status: 403 });
        }

        // Lösche Template
        await base44.entities.WhatsAppTemplate.delete(template_id);

        return Response.json({
            success: true,
            message: 'Template gelöscht'
        });

    } catch (error) {
        console.error('Delete template error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, message, type, entity_type, entity_id, action_url, target_user_id } = await req.json();

        // Notification erstellen
        const notification = await base44.entities.Notification.create({
            user_id: target_user_id || user.id,
            title,
            message,
            type: type || 'info',
            entity_type: entity_type || null,
            entity_id: entity_id || null,
            action_url: action_url || null,
            is_read: false
        });

        return Response.json({ success: true, notification });

    } catch (error) {
        console.error('Notification creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { tenant_id, notification_type, title, message, related_entity_id } = await req.json();

        if (!tenant_id || !notification_type || !title) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const notification = await base44.asServiceRole.entities.Notification.create({
            tenant_id,
            notification_type,
            title,
            message,
            related_entity_id,
            is_read: false,
            created_at: new Date().toISOString()
        });

        return Response.json({ success: true, notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
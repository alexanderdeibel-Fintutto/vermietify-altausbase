import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, entity_type, entity_id, old_values, new_values } = await req.json();

        // IP und User Agent extrahieren
        const ip_address = req.headers.get('x-forwarded-for') || 
                          req.headers.get('x-real-ip') || 
                          'unknown';
        const user_agent = req.headers.get('user-agent') || 'unknown';

        // Activity Log erstellen
        await base44.entities.ActivityLog.create({
            user_action: action,
            entity_type,
            entity_id: entity_id || null,
            old_values: old_values || null,
            new_values: new_values || null,
            ip_address,
            user_agent
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Activity logging error:', error);
        // Fehler nicht an User weitergeben, um Hauptfunktion nicht zu blockieren
        return Response.json({ success: false, error: error.message }, { status: 200 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_contact_id } = await req.json();

        // Lade alle ungelesenen Nachrichten
        const messages = await base44.entities.WhatsAppMessage.filter({
            whatsapp_contact_id,
            richtung: 'eingehend'
        });

        let gelesen = 0;
        for (const msg of messages) {
            if (msg.status !== 'gelesen') {
                await base44.asServiceRole.entities.WhatsAppMessage.update(msg.id, {
                    status: 'gelesen',
                    gelesen_am: new Date().toISOString()
                });
                gelesen++;
            }
        }

        // Update Kontakt
        await base44.asServiceRole.entities.WhatsAppContact.update(whatsapp_contact_id, {
            ungelesene_nachrichten: 0
        });

        return Response.json({
            success: true,
            gelesen
        });

    } catch (error) {
        console.error('WhatsApp mark as read error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
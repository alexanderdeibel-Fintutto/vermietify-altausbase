import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_contact_id, format: exportFormat = 'txt' } = await req.json();

        if (!whatsapp_contact_id) {
            return Response.json({ error: 'Kontakt ID fehlt' }, { status: 400 });
        }

        // Hole Kontakt
        const kontakte = await base44.entities.WhatsAppContact.filter({ 
            id: whatsapp_contact_id 
        });

        if (kontakte.length === 0) {
            return Response.json({ error: 'Kontakt nicht gefunden' }, { status: 404 });
        }

        const kontakt = kontakte[0];

        // Prüfe Berechtigung
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: kontakt.whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Keine Berechtigung' }, { status: 403 });
        }

        // Hole alle Nachrichten
        const nachrichten = await base44.entities.WhatsAppMessage.filter({
            whatsapp_contact_id: kontakt.id
        });

        // Sortiere nach Datum
        nachrichten.sort((a, b) => 
            new Date(a.created_date) - new Date(b.created_date)
        );

        let exportContent = '';

        if (exportFormat === 'txt') {
            exportContent = `WhatsApp Konversation mit ${kontakt.name}\n`;
            exportContent += `Telefonnummer: ${kontakt.telefonnummer}\n`;
            exportContent += `Exportiert am: ${new Date().toLocaleString('de-DE')}\n`;
            exportContent += `\n${'='.repeat(60)}\n\n`;

            nachrichten.forEach(msg => {
                const datum = new Date(msg.created_date).toLocaleString('de-DE');
                const absender = msg.richtung === 'ausgehend' ? 'Ich' : kontakt.name;
                
                exportContent += `[${datum}] ${absender}:\n`;
                exportContent += `${msg.nachricht_text}\n\n`;
            });
        } else if (exportFormat === 'json') {
            exportContent = JSON.stringify({
                kontakt: {
                    name: kontakt.name,
                    telefonnummer: kontakt.telefonnummer
                },
                export_datum: new Date().toISOString(),
                nachrichten: nachrichten.map(m => ({
                    datum: m.created_date,
                    richtung: m.richtung,
                    typ: m.typ,
                    text: m.nachricht_text,
                    status: m.status
                }))
            }, null, 2);
        }

        return Response.json({
            success: true,
            content: exportContent,
            filename: `whatsapp_${kontakt.name}_${Date.now()}.${exportFormat}`,
            message_count: nachrichten.length
        });

    } catch (error) {
        console.error('Export conversation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
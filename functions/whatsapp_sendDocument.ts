import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id, whatsapp_contact_id, begleitnachricht, template_id } = await req.json();

        // Lade Dokument
        const documents = await base44.entities.Document.filter({ id: document_id });
        if (!documents || documents.length === 0) {
            return Response.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
        }
        const document = documents[0];

        // Sende via whatsapp_sendMessage
        const sendResult = await base44.functions.invoke('whatsapp_sendMessage', {
            whatsapp_contact_id,
            nachricht_text: begleitnachricht || 'Anbei das gewünschte Dokument',
            anhang: {
                document_id: document.id,
                file_url: document.pdf_url,
                typ: 'pdf',
                dateiname: document.name,
                groesse: document.seitenanzahl * 100000 // Schätzung
            },
            template_id,
            kategorie: 'utility'
        });

        if (!sendResult.data.success) {
            return Response.json({ 
                error: sendResult.data.error 
            }, { status: 400 });
        }

        // Update Dokument
        await base44.entities.Document.update(document.id, {
            versandstatus: 'versendet',
            versandt_am: new Date().toISOString()
        });

        return Response.json({
            success: true,
            message_id: sendResult.data.message_id,
            document_versandt: true
        });

    } catch (error) {
        console.error('WhatsApp send document error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
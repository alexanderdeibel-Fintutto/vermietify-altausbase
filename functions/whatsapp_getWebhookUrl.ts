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

        // Prüfe Berechtigung
        const accounts = await base44.entities.WhatsAppAccount.filter({
            id: whatsapp_account_id,
            user_id: user.id
        });

        if (accounts.length === 0) {
            return Response.json({ error: 'Account nicht gefunden' }, { status: 404 });
        }

        const account = accounts[0];

        // Webhook-URL generieren
        const baseUrl = Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com';
        const webhookUrl = `${baseUrl}/api/functions/whatsapp_webhook`;

        // Anleitung generieren
        const instructions = {
            trengo: `
1. Gehen Sie zu Trengo → Einstellungen → WhatsApp Business
2. Fügen Sie folgende Webhook-URL hinzu: ${webhookUrl}
3. Wählen Sie folgende Events aus:
   - message.received
   - message.status
4. Verwenden Sie dieses Secret: ${account.webhook_secret}
5. Speichern Sie die Einstellungen
            `.trim(),
            chatarmin: `
1. Öffnen Sie Chatarmin → Einstellungen → Webhooks
2. Webhook-URL: ${webhookUrl}
3. Webhook-Secret: ${account.webhook_secret}
4. Aktivieren Sie: Eingehende Nachrichten, Status-Updates
5. Speichern und testen Sie die Verbindung
            `.trim(),
            respond_io: `
1. Gehen Sie zu respond.io → Settings → Integrations
2. Fügen Sie einen neuen Webhook hinzu
3. URL: ${webhookUrl}
4. Secret: ${account.webhook_secret}
5. Events: message_received, message_updated
            `.trim()
        };

        return Response.json({
            success: true,
            webhook_url: webhookUrl,
            webhook_secret: account.webhook_secret,
            anbieter: account.anbieter,
            instructions: instructions[account.anbieter] || 'Keine spezifischen Anweisungen verfügbar',
            test_command: `curl -X POST ${webhookUrl} -H "Content-Type: application/json" -d '{"type":"test"}'`
        });

    } catch (error) {
        console.error('Get webhook URL error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});
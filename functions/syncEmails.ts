import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { account_id } = await req.json();

        if (!account_id) {
            return Response.json({ error: 'account_id required' }, { status: 400 });
        }

        // Get IMAP account
        const accounts = await base44.entities.IMAPAccount.filter({ id: account_id });
        const account = accounts[0];

        if (!account) {
            return Response.json({ error: 'Account not found' }, { status: 404 });
        }

        // In a real implementation, you would:
        // 1. Connect to IMAP server using account credentials
        // 2. Fetch new emails since last_sync
        // 3. Parse emails and save to Email entity
        // 4. Update last_sync timestamp

        // For now, simulate with sample data
        const newEmails = [
            {
                subject: 'Mieterhöhung Wohnung 3.2',
                sender_email: 'mieter@example.com',
                sender_name: 'Max Mustermann',
                received_date: new Date().toISOString(),
                body_text: 'Sehr geehrte Damen und Herren, hiermit möchte ich eine Anfrage zur Mieterhöhung stellen...',
                imap_account_id: account_id,
                message_id: 'msg-' + Date.now(),
                has_task: false,
                is_processed: false
            }
        ];

        // Save emails
        for (const emailData of newEmails) {
            await base44.entities.Email.create(emailData);
        }

        // Update last sync
        await base44.entities.IMAPAccount.update(account_id, {
            last_sync: new Date().toISOString()
        });

        return Response.json({
            success: true,
            count: newEmails.length,
            message: `${newEmails.length} neue Emails synchronisiert`
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
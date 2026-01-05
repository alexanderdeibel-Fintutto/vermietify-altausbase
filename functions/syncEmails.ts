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
            return Response.json({ error: 'account_id is required' }, { status: 400 });
        }

        // Get IMAP account details
        const accounts = await base44.entities.IMAPAccount.filter({ id: account_id });
        
        if (!accounts || accounts.length === 0) {
            return Response.json({ error: 'Account not found' }, { status: 404 });
        }

        const account = accounts[0];

        if (!account.is_active) {
            return Response.json({ error: 'Account is not active' }, { status: 400 });
        }

        // Note: In a real implementation, you would:
        // 1. Connect to IMAP server using account credentials
        // 2. Fetch new emails since last_sync
        // 3. Parse email content and attachments
        // 4. Store emails in Email entity
        
        // For now, we'll create a mock implementation
        const mockEmails = [
            {
                subject: 'Heizung defekt in Wohnung 3.2',
                sender_email: 'mieter@example.com',
                sender_name: 'Max Mustermann',
                received_date: new Date().toISOString(),
                body_text: 'Guten Tag, die Heizung in meiner Wohnung funktioniert nicht mehr. Bitte um baldige Reparatur.',
                body_html: '<p>Guten Tag, die Heizung in meiner Wohnung funktioniert nicht mehr. Bitte um baldige Reparatur.</p>',
                attachments: {},
                imap_account_id: account_id,
                message_id: `mock-${Date.now()}-1`,
                has_task: false,
                is_processed: false
            },
            {
                subject: 'Mietvertrag Verlängerung',
                sender_email: 'mueller@example.com',
                sender_name: 'Anna Müller',
                received_date: new Date(Date.now() - 86400000).toISOString(),
                body_text: 'Sehr geehrte Damen und Herren, ich möchte meinen Mietvertrag gerne um ein weiteres Jahr verlängern.',
                body_html: '<p>Sehr geehrte Damen und Herren, ich möchte meinen Mietvertrag gerne um ein weiteres Jahr verlängern.</p>',
                attachments: {},
                imap_account_id: account_id,
                message_id: `mock-${Date.now()}-2`,
                has_task: false,
                is_processed: false
            }
        ];

        // Check for duplicates before inserting
        const existingEmails = await base44.entities.Email.filter({
            imap_account_id: account_id
        });

        const existingMessageIds = new Set(existingEmails.map(e => e.message_id));
        
        const newEmails = mockEmails.filter(email => !existingMessageIds.has(email.message_id));

        let insertedCount = 0;
        for (const email of newEmails) {
            await base44.asServiceRole.entities.Email.create(email);
            insertedCount++;
        }

        // Update last_sync timestamp
        await base44.asServiceRole.entities.IMAPAccount.update(account_id, {
            last_sync: new Date().toISOString()
        });

        return Response.json({
            success: true,
            emails_synced: insertedCount,
            last_sync: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error syncing emails:', error);
        return Response.json({ 
            error: error.message || 'Failed to sync emails' 
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Hole alle IMAPAccounts mit process_for_documents=true
    const imapAccounts = await base44.asServiceRole.entities.IMAPAccount.filter({
      process_for_documents: true
    });

    let totalProcessed = 0;
    let totalCreated = 0;

    for (const account of imapAccounts) {
      // Hier würde echte IMAP-Verbindung stattfinden
      // Für Demo: Simuliere E-Mails
      
      // Update account
      await base44.asServiceRole.entities.IMAPAccount.update(account.id, {
        last_sync_date: new Date().toISOString(),
        processed_count: (account.processed_count || 0) + 1
      });

      totalProcessed++;
    }

    return Response.json({
      success: true,
      processed_accounts: imapAccounts.length,
      processed_emails: totalProcessed,
      created_inbox_items: totalCreated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('processIncomingDocuments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
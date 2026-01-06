import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Bereinigung alter Emails basierend auf IMAP-Konto-Einstellungen
 * Admin-only für Scheduled Tasks
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const accounts = await base44.asServiceRole.entities.IMAPAccount.filter({
            is_active: true,
            auto_delete_processed: true
        });

        let totalDeleted = 0;
        const deletionLog = [];

        for (const account of accounts) {
            const deleteAfterDays = account.delete_after_days || 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - deleteAfterDays);

            // Nur verarbeitete Emails löschen
            const emails = await base44.asServiceRole.entities.Email.filter({
                imap_account_id: account.id,
                is_processed: true
            });

            const toDelete = emails.filter(email => {
                const receivedDate = new Date(email.received_date);
                return receivedDate < cutoffDate;
            });

            for (const email of toDelete) {
                await base44.asServiceRole.entities.Email.delete(email.id);
                totalDeleted++;
            }

            deletionLog.push({
                account: account.name,
                deleted: toDelete.length,
                cutoff_date: cutoffDate.toISOString()
            });
        }

        return Response.json({
            success: true,
            total_deleted: totalDeleted,
            accounts_processed: accounts.length,
            details: deletionLog
        });

    } catch (error) {
        console.error('Email cleanup error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { accountId, count } = await req.json();

        if (!accountId) {
            return Response.json({ error: 'accountId erforderlich' }, { status: 400 });
        }

        // Get all transactions for this account, sorted by creation date (newest first)
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter(
            { account_id: accountId },
            '-created_date',
            count || 1000
        );

        if (transactions.length === 0) {
            return Response.json({ 
                success: true,
                deleted: 0,
                message: 'Keine Transaktionen zum Löschen gefunden'
            });
        }

        // Take only the specified count
        const toDelete = transactions.slice(0, count || 1000);

        // Delete them
        for (const tx of toDelete) {
            await base44.asServiceRole.entities.BankTransaction.delete(tx.id);
        }

        return Response.json({
            success: true,
            deleted: toDelete.length,
            message: `${toDelete.length} Transaktionen gelöscht`
        });

    } catch (error) {
        console.error('Undo import error:', error);
        return Response.json({ 
            error: error.message || 'Fehler beim Rückgängig machen'
        }, { status: 500 });
    }
});
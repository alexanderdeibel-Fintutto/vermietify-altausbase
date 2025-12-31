import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId, count } = body;

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

        // Delete in batches to avoid rate limits
        const batchSize = 10;
        let deleted = 0;
        
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = toDelete.slice(i, i + batchSize);
            await Promise.all(
                batch.map(tx => base44.asServiceRole.entities.BankTransaction.delete(tx.id))
            );
            deleted += batch.length;
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < toDelete.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return Response.json({
            success: true,
            deleted: deleted,
            message: `${deleted} Transaktionen gelöscht`
        });

    } catch (error) {
        console.error('Undo import error:', error);
        return Response.json({ 
            error: error.message || 'Fehler beim Rückgängig machen'
        }, { status: 500 });
    }
});
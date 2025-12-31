import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId } = body;

        if (!accountId) {
            return Response.json({ error: 'accountId erforderlich' }, { status: 400 });
        }

        // Get ALL transactions for this account, sorted by creation date (newest first)
        let allTransactions = [];
        let hasMore = true;
        let skip = 0;
        const limit = 1000;

        while (hasMore) {
            const batch = await base44.asServiceRole.entities.BankTransaction.filter(
                { account_id: accountId },
                '-created_date',
                limit,
                skip
            );

            if (batch.length === 0) {
                hasMore = false;
            } else {
                allTransactions = allTransactions.concat(batch);
                skip += batch.length;

                if (batch.length < limit) {
                    hasMore = false;
                }
            }
        }

        if (allTransactions.length === 0) {
            return Response.json({ 
                success: true,
                deleted: 0,
                message: 'Keine Transaktionen zum Löschen gefunden'
            });
        }

        // Find the last import batch: all transactions created within 5 minutes of the newest transaction
        const newestDate = new Date(allTransactions[0].created_date);
        const importTimeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds

        const lastImportBatch = allTransactions.filter(tx => {
            const txDate = new Date(tx.created_date);
            return (newestDate - txDate) <= importTimeWindow;
        });

        if (lastImportBatch.length === 0) {
            return Response.json({ 
                success: true,
                deleted: 0,
                message: 'Keine Transaktionen im letzten Import gefunden'
            });
        }

        // Delete in small batches to avoid rate limits
        const batchSize = 10;
        let deleted = 0;

        for (let i = 0; i < lastImportBatch.length; i += batchSize) {
            const batch = lastImportBatch.slice(i, i + batchSize);
            await Promise.all(
                batch.map(tx => base44.asServiceRole.entities.BankTransaction.delete(tx.id))
            );
            deleted += batch.length;

            if (i + batchSize < lastImportBatch.length) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        return Response.json({
            success: true,
            deleted: deleted,
            total: lastImportBatch.length,
            message: `Letzter Import rückgängig gemacht: ${deleted} Transaktionen gelöscht`
        });

    } catch (error) {
        console.error('Undo import error:', error);
        return Response.json({ 
            error: error.message || 'Fehler beim Rückgängig machen'
        }, { status: 500 });
    }
});
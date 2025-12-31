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

        // Get ALL transactions for this account
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

                // If we got less than the limit, we're done
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

        // Delete in small batches to avoid rate limits
        const batchSize = 10;
        let deleted = 0;

        for (let i = 0; i < allTransactions.length; i += batchSize) {
            const batch = allTransactions.slice(i, i + batchSize);
            await Promise.all(
                batch.map(tx => base44.asServiceRole.entities.BankTransaction.delete(tx.id))
            );
            deleted += batch.length;

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < allTransactions.length) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        return Response.json({
            success: true,
            deleted: deleted,
            total: allTransactions.length,
            message: `${deleted} von ${allTransactions.length} Transaktionen gelöscht`
        });

    } catch (error) {
        console.error('Undo import error:', error);
        return Response.json({ 
            error: error.message || 'Fehler beim Rückgängig machen'
        }, { status: 500 });
    }
});
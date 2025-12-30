import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all financial items and all links
        const allFinancialItems = await base44.asServiceRole.entities.FinancialItem.list();
        const allLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.list();

        // Group links by financial_item_id
        const linksByItem = {};
        for (const link of allLinks) {
            if (!linksByItem[link.financial_item_id]) {
                linksByItem[link.financial_item_id] = [];
            }
            linksByItem[link.financial_item_id].push(link);
        }

        let updated = 0;
        let errors = 0;

        // Prepare batch updates
        const BATCH_SIZE = 50;
        const itemsToUpdate = [];

        // Recalculate each financial item and collect updates
        for (const item of allFinancialItems) {
            const links = linksByItem[item.id] || [];
            const paidAmount = parseFloat(links.reduce((sum, link) => sum + (link.linked_amount || 0), 0).toFixed(2));
            const expectedAmount = item.expected_amount || 0;

            let status = 'pending';
            if (paidAmount >= expectedAmount - 0.01) {
                status = 'paid';
            } else if (paidAmount > 0) {
                status = 'partial';
            }

            // Check if overdue (only if not fully paid)
            if (status !== 'paid' && item.due_date) {
                try {
                    const dueDate = new Date(item.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (dueDate < today) {
                        status = 'overdue';
                    }
                } catch (error) {
                    console.error(`Error parsing due_date for item ${item.id}:`, error);
                }
            }

            // Only update if something changed
            if (item.amount !== paidAmount || item.status !== status) {
                itemsToUpdate.push({
                    id: item.id,
                    amount: paidAmount,
                    status: status
                });
            }
        }

        // Process in batches with delay to avoid rate limiting
        for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
            const batch = itemsToUpdate.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (item) => {
                try {
                    await base44.asServiceRole.entities.FinancialItem.update(item.id, {
                        amount: item.amount,
                        status: item.status
                    });
                    updated++;
                } catch (error) {
                    console.error(`Error updating financial item ${item.id}:`, error);
                    errors++;
                }
            }));

            // Small delay between batches
            if (i + BATCH_SIZE < itemsToUpdate.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return Response.json({
            success: true,
            total: allFinancialItems.length,
            updated,
            errors,
            message: `${updated} Forderungen aktualisiert von ${allFinancialItems.length} gesamt`
        });
    } catch (error) {
        console.error('Error recalculating financial items:', error);
        return Response.json({
            error: error.message || 'Failed to recalculate'
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionIds } = await req.json();

        if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
            return Response.json({ error: 'Transaction IDs required' }, { status: 400 });
        }

        console.log(`Bulk uncategorizing ${transactionIds.length} transactions`);

        let successCount = 0;
        let errorCount = 0;
        const affectedItemIds = new Set();

        for (const transactionId of transactionIds) {
            try {
                // Get all links for this transaction
                const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    transaction_id: transactionId
                });

                // Store affected item IDs
                links.forEach(link => affectedItemIds.add(link.financial_item_id));

                // Delete all links
                for (const link of links) {
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
                }

                // Update transaction to uncategorized
                await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
                    is_categorized: false,
                    category: null,
                    unit_id: null,
                    contract_id: null
                });

                successCount++;
            } catch (error) {
                console.error(`Error uncategorizing transaction ${transactionId}:`, error);
                errorCount++;
            }
        }

        // Recalculate status for all affected financial items
        console.log(`Recalculating ${affectedItemIds.size} affected financial items`);
        
        for (const itemId of affectedItemIds) {
            try {
                await recalculateFinancialItemStatus(base44, itemId);
            } catch (error) {
                console.error(`Error recalculating item ${itemId}:`, error);
            }
        }

        return Response.json({
            success: true,
            uncategorized: successCount,
            errors: errorCount,
            affectedItems: affectedItemIds.size
        });

    } catch (error) {
        console.error('Bulk uncategorize error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});

async function recalculateFinancialItemStatus(base44, financialItemId) {
    // Get all remaining links for this financial item
    const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
        financial_item_id: financialItemId
    });

    // Calculate total paid
    const totalPaid = links.reduce((sum, link) => sum + (link.linked_amount || 0), 0);

    // Get the financial item to check expected amount
    const item = await base44.asServiceRole.entities.FinancialItem.get(financialItemId);
    const expected = item.expected_amount || 0;

    // Determine new status
    let newStatus = 'pending';
    if (totalPaid >= expected) {
        newStatus = 'paid';
    } else if (totalPaid > 0) {
        newStatus = 'partial';
    } else if (item.status === 'overdue') {
        newStatus = 'overdue';
    }

    // Update the financial item
    await base44.asServiceRole.entities.FinancialItem.update(financialItemId, {
        amount: totalPaid,
        status: newStatus
    });
}
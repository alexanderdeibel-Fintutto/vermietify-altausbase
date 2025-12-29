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
            return Response.json({ error: 'transactionIds array is required' }, { status: 400 });
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        const affectedFinancialItemIds = new Set();

        for (const transactionId of transactionIds) {
            try {
                // Remove all financial item links for these transactions
                const financialItemLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    transaction_id: transactionId
                });

                for (const link of financialItemLinks) {
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
                    affectedFinancialItemIds.add(link.financial_item_id);
                }

                // Mark transaction as uncategorized
                await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
                    is_categorized: false,
                    category: null,
                    unit_id: null,
                    contract_id: null
                });

                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({
                    transactionId,
                    error: error.message
                });
            }
        }

        // Recalculate status for all affected financial items
        for (const itemId of affectedFinancialItemIds) {
            await recalculateFinancialItemStatus(base44, itemId);
        }

        return Response.json({
            success: true,
            successCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `${successCount} Transaktionen entkategorisiert, ${errorCount} Fehler`
        });
    } catch (error) {
        console.error('Error bulk uncategorizing:', error);
        return Response.json({
            error: error.message || 'Failed to bulk uncategorize'
        }, { status: 500 });
    }
});

async function recalculateFinancialItemStatus(base44, financialItemId) {
    const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
        financial_item_id: financialItemId
    });

    const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);

    const items = await base44.asServiceRole.entities.FinancialItem.filter({ id: financialItemId });
    if (items.length === 0) return;

    const item = items[0];
    const expectedAmount = item.expected_amount || 0;

    let status = 'pending';
    if (paidAmount >= expectedAmount) {
        status = 'paid';
    } else if (paidAmount > 0) {
        status = 'partial';
    }

    await base44.asServiceRole.entities.FinancialItem.update(financialItemId, {
        amount: paidAmount,
        status: status
    });
}
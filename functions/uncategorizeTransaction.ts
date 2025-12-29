import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId } = await req.json();

        if (!transactionId) {
            return Response.json({ error: 'transactionId is required' }, { status: 400 });
        }

        // Remove all financial item links for this transaction
        const financialItemLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
            transaction_id: transactionId
        });

        const affectedFinancialItemIds = new Set();
        for (const link of financialItemLinks) {
            affectedFinancialItemIds.add(link.financial_item_id);
            await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
        }

        // Recalculate status for affected financial items
        for (const itemId of affectedFinancialItemIds) {
            await recalculateFinancialItemStatus(base44, itemId);
        }

        // Mark transaction as uncategorized
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: false,
            category: null,
            unit_id: null,
            contract_id: null
        });

        return Response.json({
            success: true,
            message: 'Transaction uncategorized successfully'
        });
    } catch (error) {
        console.error('Error uncategorizing transaction:', error);
        return Response.json({
            error: error.message || 'Failed to uncategorize transaction'
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
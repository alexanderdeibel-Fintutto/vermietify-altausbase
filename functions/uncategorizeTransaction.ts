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

        // Get all links for this transaction
        const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
            transaction_id: transactionId
        });

        const affectedItemIds = new Set();
        
        // Delete all links
        for (const link of links) {
            affectedItemIds.add(link.financial_item_id);
            await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
        }

        // Recalculate all affected financial items
        for (const itemId of affectedItemIds) {
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
            affectedItems: affectedItemIds.size
        });

    } catch (error) {
        console.error('Uncategorize error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

async function recalculateFinancialItemStatus(base44, itemId) {
    // Get all links for this financial item
    const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
        financial_item_id: itemId
    });

    // Calculate total paid amount
    const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);

    // Get financial item to compare with expected amount
    const items = await base44.asServiceRole.entities.FinancialItem.filter({ id: itemId });
    if (items.length === 0) return;

    const item = items[0];
    const expectedAmount = item.expected_amount || 0;

    // Determine status
    let status = 'pending';
    if (paidAmount >= expectedAmount) {
        status = 'paid';
    } else if (paidAmount > 0) {
        status = 'partial';
    }

    // Update financial item
    await base44.asServiceRole.entities.FinancialItem.update(itemId, {
        amount: paidAmount,
        status: status
    });
}
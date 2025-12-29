import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId, financialItemAllocations, category, unitId, contractId } = await req.json();

        if (!transactionId || !financialItemAllocations || !Array.isArray(financialItemAllocations)) {
            return Response.json({ error: 'transactionId and financialItemAllocations are required' }, { status: 400 });
        }

        // Validate that allocation amounts are positive
        for (const allocation of financialItemAllocations) {
            if (!allocation.financialItemId || !allocation.amount || allocation.amount <= 0) {
                return Response.json({ error: 'Invalid allocation: financialItemId and positive amount required' }, { status: 400 });
            }
        }

        // Get transaction
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter({ id: transactionId });
        if (!transactions || transactions.length === 0) {
            return Response.json({ error: 'Transaction not found' }, { status: 404 });
        }
        const transaction = transactions[0];

        // Calculate total allocation
        const totalAllocated = financialItemAllocations.reduce((sum, a) => sum + a.amount, 0);
        const transactionAmount = Math.abs(transaction.amount);

        if (totalAllocated > transactionAmount) {
            return Response.json({ 
                error: `Total allocation (${totalAllocated}) exceeds transaction amount (${transactionAmount})` 
            }, { status: 400 });
        }

        // Delete existing links for this transaction
        const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
            transaction_id: transactionId
        });
        for (const link of existingLinks) {
            await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
        }

        // Create new links
        const affectedItemIds = new Set();
        for (const allocation of financialItemAllocations) {
            await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                financial_item_id: allocation.financialItemId,
                transaction_id: transactionId,
                linked_amount: allocation.amount
            });
            affectedItemIds.add(allocation.financialItemId);
        }

        // Recalculate financial item statuses
        for (const itemId of affectedItemIds) {
            await recalculateFinancialItemStatus(base44, itemId);
        }

        // Check if transaction is fully allocated
        const isFullyAllocated = totalAllocated >= transactionAmount - 0.01; // small tolerance for rounding

        // Mark transaction as categorized only if fully allocated
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: isFullyAllocated,
            category: category || 'rent_income',
            unit_id: unitId || null,
            contract_id: contractId || null
        });

        return Response.json({ 
            success: true,
            message: `Transaction allocated to ${affectedItemIds.size} financial item(s)`
        });
    } catch (error) {
        console.error('Error reconciling transaction:', error);
        return Response.json({ 
            error: error.message || 'Failed to reconcile transaction' 
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allocations, category, unitId, contractId } = await req.json();

        if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
            return Response.json({ error: 'No allocations provided' }, { status: 400 });
        }

        if (!category) {
            return Response.json({ error: 'Category is required' }, { status: 400 });
        }

        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        const processedTransactionIds = new Set();
        const allAffectedFinancialItemIds = new Set();

        // Step 1: Create all FinancialItemTransactionLinks based on the exact data from the frontend
        for (const allocation of allocations) {
            if (!allocation.transactionId || !allocation.financialItemId || !allocation.linkedAmount || parseFloat(allocation.linkedAmount) <= 0) {
                console.warn('Skipping invalid allocation:', allocation);
                results.errors++;
                results.details.push({ error: 'Invalid allocation data', allocation });
                continue;
            }

            processedTransactionIds.add(allocation.transactionId);
            allAffectedFinancialItemIds.add(allocation.financialItemId);

            try {
                // Delete existing links for this specific transaction-financial item pair to prevent duplicates
                const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    transaction_id: allocation.transactionId,
                    financial_item_id: allocation.financialItemId
                });
                for (const link of existingLinks) {
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
                }

                await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                    financial_item_id: allocation.financialItemId,
                    transaction_id: allocation.transactionId,
                    linked_amount: parseFloat(allocation.linkedAmount)
                });
                results.success++;
            } catch (error) {
                console.error(`Error creating link for transaction ${allocation.transactionId} and financial item ${allocation.financialItemId}:`, error);
                results.errors++;
                results.details.push({ 
                    transactionId: allocation.transactionId, 
                    financialItemId: allocation.financialItemId,
                    error: error.message 
                });
            }
        }

        // Step 2: Update all affected transactions as categorized
        for (const txId of processedTransactionIds) {
            try {
                await base44.asServiceRole.entities.BankTransaction.update(txId, {
                    is_categorized: true,
                    category: category,
                    unit_id: unitId || null,
                    contract_id: contractId || null
                });
            } catch (error) {
                console.error(`Error updating transaction ${txId}:`, error);
                results.details.push({ transactionId: txId, error: `Transaction update error: ${error.message}` });
            }
        }

        // Step 3: Recalculate all affected financial items' total amount and status
        for (const itemId of allAffectedFinancialItemIds) {
            try {
                const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    financial_item_id: itemId
                });
                const paidAmount = parseFloat(links.reduce((sum, link) => sum + link.linked_amount, 0).toFixed(2));
                
                const items = await base44.asServiceRole.entities.FinancialItem.filter({ id: itemId });
                if (items.length > 0) {
                    const item = items[0];
                    const expectedAmount = item.expected_amount || 0;
                    let status = 'pending';
                    if (paidAmount >= expectedAmount - 0.01) {
                        status = 'paid';
                    } else if (paidAmount > 0) {
                        status = 'partial';
                    }
                    await base44.asServiceRole.entities.FinancialItem.update(itemId, {
                        amount: paidAmount,
                        status: status
                    });
                }
            } catch (error) {
                console.error(`Error updating financial item ${itemId}:`, error);
                results.details.push({ financialItemId: itemId, error: `Financial item update error: ${error.message}` });
            }
        }

        return Response.json(results);
    } catch (error) {
        console.error('Bulk allocation error:', error);
        return Response.json({ 
            error: error.message,
            success: 0,
            errors: 0,
            details: []
        }, { status: 500 });
    }
});
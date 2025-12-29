import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionIds, category, unitId, contractId, allocations } = await req.json();

        if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
            return Response.json({ error: 'No transaction IDs provided' }, { status: 400 });
        }

        if (!category) {
            return Response.json({ error: 'Category is required' }, { status: 400 });
        }

        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        // Get all transactions at once
        const transactions = await Promise.all(
            transactionIds.map(id => base44.asServiceRole.entities.BankTransaction.filter({ id }))
        );

        const flatTransactions = transactions.flat();

        // Process all transactions
        if (category === 'rent_income' && contractId && allocations && allocations.length > 0) {
            // With financial item allocations - optimized batch processing
            const allAffectedItemIds = new Set();
            
            for (const tx of flatTransactions) {
                try {
                    // Delete existing links for this transaction
                    const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                        transaction_id: tx.id
                    });
                    await Promise.all(existingLinks.map(link => 
                        base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id)
                    ));

                    // Create new links in parallel
                    let totalAllocated = 0;
                    await Promise.all(allocations.map(async (allocation) => {
                        if (allocation.financialItemId && allocation.amount > 0) {
                            await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                                financial_item_id: allocation.financialItemId,
                                transaction_id: tx.id,
                                linked_amount: allocation.amount
                            });
                            allAffectedItemIds.add(allocation.financialItemId);
                            totalAllocated += allocation.amount;
                        }
                    }));

                    // Update transaction
                    const transactionAmount = Math.abs(tx.amount);
                    const isFullyAllocated = totalAllocated >= transactionAmount - 0.01;
                    
                    await base44.asServiceRole.entities.BankTransaction.update(tx.id, {
                        is_categorized: isFullyAllocated,
                        category: category,
                        unit_id: unitId || null,
                        contract_id: contractId || null
                    });

                    results.success++;
                } catch (error) {
                    console.error(`Error processing transaction ${tx.id}:`, error);
                    results.errors++;
                    results.details.push({ transactionId: tx.id, error: error.message });
                }
            }

            // Recalculate all affected financial items once at the end
            await Promise.all(Array.from(allAffectedItemIds).map(async (itemId) => {
                const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    financial_item_id: itemId
                });
                const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);
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
            }));
        } else {
            // Simple categorization without financial items - batch update
            const updatePromises = flatTransactions.map(tx =>
                base44.asServiceRole.entities.BankTransaction.update(tx.id, {
                    is_categorized: true,
                    category,
                    unit_id: unitId || null,
                    contract_id: contractId || null
                })
            );

            const updateResults = await Promise.allSettled(updatePromises);
            
            updateResults.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    results.success++;
                } else {
                    results.errors++;
                    results.details.push({ 
                        transactionId: flatTransactions[idx].id, 
                        error: result.reason?.message || 'Unknown error' 
                    });
                }
            });
        }

        return Response.json(results);
    } catch (error) {
        console.error('Bulk allocation error:', error);
        return Response.json({ 
            error: error.message,
            success: 0,
            errors: 0
        }, { status: 500 });
    }
});
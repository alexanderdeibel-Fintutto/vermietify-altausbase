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

        // Process allocations - DIRECT allocation, no proportional distribution
        if (category === 'rent_income' && contractId && allocations && allocations.length > 0) {
            const allAffectedItemIds = new Set();
            
            // For each allocation, create the exact link as specified
            for (const allocation of allocations) {
                if (!allocation.financialItemId || !allocation.amount || parseFloat(allocation.amount) <= 0) {
                    continue;
                }

                const allocAmount = parseFloat(allocation.amount);
                allAffectedItemIds.add(allocation.financialItemId);

                // Distribute this allocation amount across all selected transactions proportionally
                const totalTransactionAmount = flatTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                
                for (const tx of flatTransactions) {
                    try {
                        const txAmount = Math.abs(tx.amount);
                        const txShare = txAmount / totalTransactionAmount;
                        const linkedAmount = allocAmount * txShare;

                        // Create the link with the calculated share
                        await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                            financial_item_id: allocation.financialItemId,
                            transaction_id: tx.id,
                            linked_amount: linkedAmount
                        });
                    } catch (error) {
                        console.error(`Error creating link for transaction ${tx.id}:`, error);
                        results.errors++;
                        results.details.push({ 
                            transactionId: tx.id, 
                            financialItemId: allocation.financialItemId,
                            error: error.message 
                        });
                    }
                }
            }

            // Update all transactions as categorized
            for (const tx of flatTransactions) {
                try {
                    // Check total allocated for this transaction
                    const txLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                        transaction_id: tx.id
                    });
                    const totalAllocated = txLinks.reduce((sum, link) => sum + link.linked_amount, 0);
                    const isFullyAllocated = totalAllocated >= Math.abs(tx.amount) - 0.01;

                    await base44.asServiceRole.entities.BankTransaction.update(tx.id, {
                        is_categorized: isFullyAllocated,
                        category: category,
                        unit_id: unitId || null,
                        contract_id: contractId || null
                    });

                    results.success++;
                } catch (error) {
                    console.error(`Error updating transaction ${tx.id}:`, error);
                    results.errors++;
                    results.details.push({ transactionId: tx.id, error: error.message });
                }
            }

            // Recalculate all affected financial items
            for (const itemId of allAffectedItemIds) {
                try {
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
                } catch (error) {
                    console.error(`Error updating financial item ${itemId}:`, error);
                }
            }
        } else {
            // Simple categorization without financial items
            const updatePromises = flatTransactions.map(tx =>
                base44.asServiceRole.entities.BankTransaction.update(tx.id, {
                    is_categorized: false,
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
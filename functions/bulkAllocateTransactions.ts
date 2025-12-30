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
        const newLinksToCreate = [];

        // Collect all affected financial items and valid allocations
        for (const allocation of allocations) {
            if (allocation.financialItemId) {
                allAffectedFinancialItemIds.add(allocation.financialItemId);
            }
            if (allocation.transactionId) {
                processedTransactionIds.add(allocation.transactionId);
            }
        }

        // Step 1: Delete ALL existing links for affected financial items to start fresh
        for (const financialItemId of allAffectedFinancialItemIds) {
            try {
                const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    financial_item_id: financialItemId
                });
                for (const link of existingLinks) {
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
                }
            } catch (error) {
                console.error(`Error deleting existing links for financial item ${financialItemId}:`, error);
            }
        }

        // Step 2: Collect all new FinancialItemTransactionLinks for bulk creation
        for (const allocation of allocations) {
            if (!allocation.transactionId || !allocation.financialItemId || !allocation.linkedAmount || parseFloat(allocation.linkedAmount) <= 0) {
                console.warn('Skipping invalid allocation:', allocation);
                results.errors++;
                results.details.push({ error: 'Invalid allocation data', allocation });
                continue;
            }

            newLinksToCreate.push({
                financial_item_id: allocation.financialItemId,
                transaction_id: allocation.transactionId,
                linked_amount: parseFloat(allocation.linkedAmount)
            });
        }

        // Execute bulk creation of links
        if (newLinksToCreate.length > 0) {
            try {
                await base44.asServiceRole.entities.FinancialItemTransactionLink.bulkCreate(newLinksToCreate);
                results.success += newLinksToCreate.length;
            } catch (error) {
                console.error('Bulk link creation error:', error);
                results.errors += newLinksToCreate.length;
                results.details.push({ error: 'Bulk link creation failed', details: error.message });
            }
        }

        // Step 3: Update all affected transactions as categorized
        for (const txId of processedTransactionIds) {
            try {
                // Find the allocation for this transaction to get its specific unitId and contractId
                const firstAllocation = allocations.find(alloc => alloc.transactionId === txId);
                
                await base44.asServiceRole.entities.BankTransaction.update(txId, {
                    is_categorized: true,
                    category: category,
                    unit_id: firstAllocation?.unitId || unitId || null,
                    contract_id: firstAllocation?.contractId || contractId || null
                });
            } catch (error) {
                console.error(`Error updating transaction ${txId}:`, error);
                results.errors++;
                results.details.push({ transactionId: txId, error: `Transaction update error: ${error.message}` });
            }
        }

        // Step 4: Recalculate all affected financial items' total amount and status
        // Optimize: Fetch all relevant links once
        let allRelevantLinks = [];
        try {
            allRelevantLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.list();
        } catch (error) {
            console.error('Error fetching all links:', error);
        }

        // Group links by financial_item_id in memory
        const linksByFinancialItem = {};
        for (const link of allRelevantLinks) {
            if (allAffectedFinancialItemIds.has(link.financial_item_id)) {
                if (!linksByFinancialItem[link.financial_item_id]) {
                    linksByFinancialItem[link.financial_item_id] = [];
                }
                linksByFinancialItem[link.financial_item_id].push(link);
            }
        }

        for (const itemId of allAffectedFinancialItemIds) {
            try {
                const links = linksByFinancialItem[itemId] || [];
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
                    } else {
                        status = 'pending';
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
                            console.error(`Error parsing due_date for item ${itemId}:`, error);
                        }
                    }
                    
                    await base44.asServiceRole.entities.FinancialItem.update(itemId, {
                        amount: paidAmount,
                        status: status
                    });
                }
            } catch (error) {
                console.error(`Error updating financial item ${itemId}:`, error);
                results.errors++;
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
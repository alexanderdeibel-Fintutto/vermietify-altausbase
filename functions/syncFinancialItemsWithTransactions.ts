import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting financial items sync...');

        // Get all data
        const [transactions, financialItems, existingLinks] = await Promise.all([
            base44.asServiceRole.entities.BankTransaction.list(),
            base44.asServiceRole.entities.FinancialItem.list(),
            base44.asServiceRole.entities.FinancialItemTransactionLink.list()
        ]);

        console.log(`Found ${transactions.length} transactions, ${financialItems.length} financial items, ${existingLinks.length} existing links`);

        let linksCreated = 0;
        let itemsUpdated = 0;
        let errors = [];

        // Step 1: Find ALL categorized rent income transactions (not just those without links)
        const categorizedTransactions = transactions.filter(tx => 
            tx.is_categorized && 
            tx.category === 'rent_income' && 
            tx.amount > 0
        );

        console.log(`Found ${categorizedTransactions.length} categorized rent income transactions`);

        // Get all contracts for lookup
        const contracts = await base44.asServiceRole.entities.LeaseContract.list();

        for (const tx of categorizedTransactions) {
            try {
                // Check if already has links
                const hasLinks = existingLinks.some(link => link.transaction_id === tx.id);
                
                if (hasLinks) {
                    console.log(`Transaction ${tx.id} already has links, skipping`);
                    continue;
                }

                const txDate = new Date(tx.transaction_date);
                const txMonth = txDate.getFullYear() + '-' + String(txDate.getMonth() + 1).padStart(2, '0');

                // Find appropriate financial item - try multiple strategies
                let candidateItems = [];
                
                // Strategy 1: Match by contract_id
                if (tx.contract_id) {
                    candidateItems = financialItems.filter(item => 
                        item.type === 'receivable' &&
                        item.related_to_contract_id === tx.contract_id
                    );
                    console.log(`Found ${candidateItems.length} items for contract ${tx.contract_id}`);
                }
                
                // Strategy 2: Match by unit_id
                if (candidateItems.length === 0 && tx.unit_id) {
                    candidateItems = financialItems.filter(item => 
                        item.type === 'receivable' &&
                        item.related_to_unit_id === tx.unit_id
                    );
                    console.log(`Found ${candidateItems.length} items for unit ${tx.unit_id}`);
                }

                // Strategy 3: Find active contract for the unit and match by that
                if (candidateItems.length === 0 && tx.unit_id) {
                    const activeContract = contracts.find(c => 
                        c.unit_id === tx.unit_id && 
                        c.status === 'active' &&
                        new Date(c.start_date) <= txDate
                    );
                    
                    if (activeContract) {
                        candidateItems = financialItems.filter(item => 
                            item.type === 'receivable' &&
                            item.related_to_contract_id === activeContract.id
                        );
                        console.log(`Found ${candidateItems.length} items via active contract ${activeContract.id}`);
                    }
                }

                if (candidateItems.length === 0) {
                    console.log(`No candidate items found for transaction ${tx.id}`);
                    errors.push({ 
                        transaction_id: tx.id, 
                        error: 'No matching financial items found',
                        details: { contract_id: tx.contract_id, unit_id: tx.unit_id, date: tx.transaction_date }
                    });
                    continue;
                }

                // Sort by payment month (oldest first)
                candidateItems = candidateItems.sort((a, b) => 
                    new Date(a.payment_month || a.due_date || '1970-01-01') - 
                    new Date(b.payment_month || b.due_date || '1970-01-01')
                );

                // Try to match by month first
                let targetItem = candidateItems.find(item => item.payment_month === txMonth);
                
                // If no match by month, find first non-fully-paid item
                if (!targetItem) {
                    targetItem = candidateItems.find(item => {
                        const currentPaid = item.amount || 0;
                        const expected = item.expected_amount || 0;
                        return currentPaid < expected;
                    });
                }
                
                // If still no match, use oldest available item
                if (!targetItem && candidateItems.length > 0) {
                    targetItem = candidateItems[0];
                }

                if (targetItem) {
                    // Create the link
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                        financial_item_id: targetItem.id,
                        transaction_id: tx.id,
                        linked_amount: Math.abs(tx.amount)
                    });
                    
                    linksCreated++;
                    console.log(`✓ Created link: Transaction ${tx.id} (€${tx.amount}) → Item ${targetItem.id} (${targetItem.payment_month})`);
                } else {
                    console.log(`No suitable target item found for transaction ${tx.id}`);
                }
            } catch (error) {
                console.error(`Error processing transaction ${tx.id}:`, error);
                errors.push({ transaction_id: tx.id, error: error.message });
            }
        }

        console.log(`Created ${linksCreated} new links`);

        // Step 2: Recalculate ALL financial items status
        console.log('Recalculating all financial item statuses...');

        for (const item of financialItems) {
            try {
                // Get all links for this item
                const itemLinks = existingLinks.filter(link => link.financial_item_id === item.id);
                
                // Add newly created links
                const newLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    financial_item_id: item.id
                });

                const allLinks = [...new Map([...itemLinks, ...newLinks].map(link => [link.id, link])).values()];

                // Calculate total paid
                const totalPaid = allLinks.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
                const expected = item.expected_amount || 0;

                // Determine status
                let newStatus = 'pending';
                if (totalPaid >= expected) {
                    newStatus = 'paid';
                } else if (totalPaid > 0) {
                    newStatus = 'partial';
                } else if (item.status === 'overdue') {
                    newStatus = 'overdue'; // Keep overdue status if not paid
                }

                // Update if changed
                if (item.amount !== totalPaid || item.status !== newStatus) {
                    await base44.asServiceRole.entities.FinancialItem.update(item.id, {
                        amount: totalPaid,
                        status: newStatus
                    });
                    itemsUpdated++;
                }
            } catch (error) {
                console.error(`Error updating financial item ${item.id}:`, error);
                errors.push({ financial_item_id: item.id, error: error.message });
            }
        }

        console.log(`Updated ${itemsUpdated} financial items`);

        const result = {
            success: true,
            linksCreated,
            itemsUpdated,
            totalTransactions: categorizedTransactions.length,
            totalItems: financialItems.length,
            alreadyLinked: categorizedTransactions.length - linksCreated - errors.length,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit to first 10 errors
            errorCount: errors.length
        };

        console.log('Sync completed:', result);

        return Response.json(result);

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});
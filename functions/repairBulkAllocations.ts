import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all categorized rent_income transactions
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter({
            is_categorized: true,
            category: 'rent_income'
        });

        // Get all financial item links
        const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.list();

        // Get all financial items
        const allItems = await base44.asServiceRole.entities.FinancialItem.list();

        let repairedCount = 0;
        let skippedCount = 0;

        for (const tx of transactions) {
            // Check if already has links
            const hasLinks = existingLinks.some(link => link.transaction_id === tx.id);
            
            if (hasLinks) {
                skippedCount++;
                continue;
            }

            // Transaction has no links but should have them
            if (!tx.contract_id && !tx.unit_id) {
                skippedCount++;
                continue;
            }

            // Find appropriate financial item based on contract or unit and date
            const txDate = new Date(tx.transaction_date);
            const txMonth = txDate.getFullYear() + '-' + String(txDate.getMonth() + 1).padStart(2, '0');

            let candidateItems = [];
            
            if (tx.contract_id) {
                // Filter by contract_id
                candidateItems = allItems.filter(item => 
                    item.type === 'receivable' &&
                    item.related_to_contract_id === tx.contract_id
                );
            } else if (tx.unit_id) {
                // Filter by unit_id if no contract_id
                candidateItems = allItems.filter(item => 
                    item.type === 'receivable' &&
                    item.related_to_unit_id === tx.unit_id
                );
            }

            // Sort by payment month
            candidateItems = candidateItems.sort((a, b) => 
                new Date(a.payment_month || a.due_date) - new Date(b.payment_month || b.due_date)
            );

            // Try to match by month first
            let targetItem = candidateItems.find(item => item.payment_month === txMonth);
            
            // If no match by month, try to find the first non-fully-paid item
            if (!targetItem) {
                targetItem = candidateItems.find(item => {
                    const currentPaid = item.amount || 0;
                    const expected = item.expected_amount || 0;
                    return currentPaid < expected;
                });
            }
            
            // If still no match, use first available
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

                // Recalculate item status
                const itemLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                    financial_item_id: targetItem.id
                });

                const totalLinked = itemLinks.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
                
                let newStatus = 'pending';
                if (totalLinked >= targetItem.expected_amount) {
                    newStatus = 'paid';
                } else if (totalLinked > 0) {
                    newStatus = 'partial';
                }

                await base44.asServiceRole.entities.FinancialItem.update(targetItem.id, {
                    amount: totalLinked,
                    status: newStatus
                });

                repairedCount++;
            } else {
                skippedCount++;
            }
        }

        return Response.json({
            success: true,
            repaired: repairedCount,
            skipped: skippedCount,
            total: transactions.length
        });

    } catch (error) {
        console.error('Repair error:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});
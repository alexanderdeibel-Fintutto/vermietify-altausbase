import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contractId } = await req.json();

        if (!contractId) {
            return Response.json({ error: 'Contract ID required' }, { status: 400 });
        }

        // Get all financial items for this contract
        const allItems = await base44.asServiceRole.entities.FinancialItem.filter({
            related_to_contract_id: contractId,
            category: 'rent'
        });

        console.log(`Found ${allItems.length} rent items for contract ${contractId}`);

        // Group by payment_month
        const itemsByMonth = {};
        allItems.forEach(item => {
            if (item.payment_month) {
                if (!itemsByMonth[item.payment_month]) {
                    itemsByMonth[item.payment_month] = [];
                }
                itemsByMonth[item.payment_month].push(item);
            }
        });

        console.log('Items by month:', Object.entries(itemsByMonth).map(([month, items]) => 
            `${month}: ${items.length} items`
        ).join(', '));

        let mergedCount = 0;
        let deletedCount = 0;

        // Process each month with duplicates
        for (const [month, items] of Object.entries(itemsByMonth)) {
            if (items.length <= 1) continue;

            // Sort: paid/partial items first, then by expected_amount descending
            items.sort((a, b) => {
                const aHasPayment = ['paid', 'partial'].includes(a.status);
                const bHasPayment = ['paid', 'partial'].includes(b.status);
                
                if (aHasPayment && !bHasPayment) return -1;
                if (!aHasPayment && bHasPayment) return 1;
                
                return (b.expected_amount || 0) - (a.expected_amount || 0);
            });

            const keepItem = items[0]; // Item with payment or highest amount
            const deleteItems = items.slice(1);

            // Get all transaction links for items to delete
            const allLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.list();
            const linksToMove = allLinks.filter(link => 
                deleteItems.some(item => item.id === link.financial_item_id)
            );

            // Move transaction links to the kept item
            for (const link of linksToMove) {
                // Check if link already exists for the kept item
                const existingLink = allLinks.find(l => 
                    l.financial_item_id === keepItem.id && 
                    l.transaction_id === link.transaction_id
                );

                if (!existingLink) {
                    await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                        financial_item_id: keepItem.id,
                        transaction_id: link.transaction_id,
                        linked_amount: link.linked_amount,
                        notes: link.notes
                    });
                }

                // Delete old link
                await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
            }

            // Recalculate the kept item's amount and status
            const keptItemLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
                financial_item_id: keepItem.id
            });
            
            const totalPaid = keptItemLinks.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
            const expectedAmount = keepItem.expected_amount || 0;
            
            let newStatus = 'pending';
            if (totalPaid >= expectedAmount - 0.01) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            } else if (keepItem.due_date) {
                const dueDate = new Date(keepItem.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dueDate < today) {
                    newStatus = 'overdue';
                }
            }

            await base44.asServiceRole.entities.FinancialItem.update(keepItem.id, {
                amount: totalPaid,
                status: newStatus
            });

            // Delete duplicate items
            for (const item of deleteItems) {
                await base44.asServiceRole.entities.FinancialItem.delete(item.id);
                deletedCount++;
            }

            mergedCount++;
        }

        return Response.json({
            success: true,
            mergedCount,
            deletedCount,
            message: `${deletedCount} Duplikate entfernt und ${mergedCount} Monate bereinigt`
        });
    } catch (error) {
        console.error('Error merging duplicates:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});
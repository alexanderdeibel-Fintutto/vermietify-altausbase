import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all transaction links
        const allLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.list();
        
        // Delete all links
        for (const link of allLinks) {
            await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
        }

        // Reset all transactions
        const allTransactions = await base44.asServiceRole.entities.BankTransaction.list();
        for (const tx of allTransactions) {
            await base44.asServiceRole.entities.BankTransaction.update(tx.id, {
                is_categorized: false,
                category: null,
                unit_id: null,
                contract_id: null
            });
        }

        // Reset all financial items
        const allItems = await base44.asServiceRole.entities.FinancialItem.list();
        for (const item of allItems) {
            await base44.asServiceRole.entities.FinancialItem.update(item.id, {
                amount: 0,
                status: item.expected_amount && item.expected_amount > 0 ? 'pending' : item.status
            });
        }

        return Response.json({ 
            success: true,
            deleted_links: allLinks.length,
            reset_transactions: allTransactions.length,
            reset_items: allItems.length
        });
    } catch (error) {
        console.error('Error deleting allocations:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});
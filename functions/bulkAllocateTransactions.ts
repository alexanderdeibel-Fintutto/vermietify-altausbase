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
            // With financial item allocations
            for (const tx of flatTransactions) {
                try {
                    // Use the existing reconcile function
                    const response = await fetch(`${Deno.env.get('BASE44_FUNCTION_URL')}/reconcileTransactionWithFinancialItems`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': req.headers.get('Authorization')
                        },
                        body: JSON.stringify({
                            transactionId: tx.id,
                            category,
                            unitId,
                            contractId,
                            financialItemAllocations: allocations
                        })
                    });

                    const result = await response.json();
                    
                    if (!response.ok || result.error) {
                        throw new Error(result.error || 'Reconciliation failed');
                    }

                    results.success++;
                } catch (error) {
                    console.error(`Error processing transaction ${tx.id}:`, error);
                    results.errors++;
                    results.details.push({ transactionId: tx.id, error: error.message });
                }
            }
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
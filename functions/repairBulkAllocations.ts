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

        // Get all payment links
        const existingLinks = await base44.asServiceRole.entities.PaymentTransactionLink.list();

        // Get all payments
        const allPayments = await base44.asServiceRole.entities.Payment.list();

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

            // Find appropriate payment based on contract or unit and date
            const txDate = new Date(tx.transaction_date);
            const txMonth = txDate.getFullYear() + '-' + String(txDate.getMonth() + 1).padStart(2, '0');

            let candidatePayments = [];
            
            if (tx.contract_id) {
                // Filter by contract_id
                candidatePayments = allPayments.filter(p => 
                    p.contract_id === tx.contract_id
                );
            } else if (tx.unit_id) {
                // Filter by unit_id if no contract_id
                candidatePayments = allPayments.filter(p => 
                    p.unit_id === tx.unit_id
                );
            }

            // Sort by payment month
            candidatePayments = candidatePayments.sort((a, b) => 
                new Date(a.payment_month) - new Date(b.payment_month)
            );

            // Try to match by month first
            let targetPayment = candidatePayments.find(p => p.payment_month === txMonth);
            
            // If no match by month, try to find the first non-fully-paid payment
            if (!targetPayment) {
                targetPayment = candidatePayments.find(p => {
                    const currentPaid = p.amount || 0;
                    const expected = p.expected_amount || 0;
                    return currentPaid < expected;
                });
            }
            
            // If still no match, use first available
            if (!targetPayment && candidatePayments.length > 0) {
                targetPayment = candidatePayments[0];
            }

            if (targetPayment) {
                // Create the link
                await base44.asServiceRole.entities.PaymentTransactionLink.create({
                    payment_id: targetPayment.id,
                    transaction_id: tx.id,
                    linked_amount: Math.abs(tx.amount)
                });

                // Recalculate payment status
                const paymentLinks = await base44.asServiceRole.entities.PaymentTransactionLink.filter({
                    payment_id: targetPayment.id
                });

                const totalLinked = paymentLinks.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
                
                let newStatus = 'pending';
                if (totalLinked >= targetPayment.expected_amount) {
                    newStatus = 'paid';
                } else if (totalLinked > 0) {
                    newStatus = 'partial';
                }

                await base44.asServiceRole.entities.Payment.update(targetPayment.id, {
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
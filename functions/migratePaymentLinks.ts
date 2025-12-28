import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all transactions with matched_payment_id
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter({
            is_categorized: true
        });

        const oldStyleTransactions = transactions.filter(tx => tx.matched_payment_id);

        console.log(`Found ${oldStyleTransactions.length} transactions with old-style payment matching`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const tx of oldStyleTransactions) {
            try {
                // Check if link already exists
                const existingLinks = await base44.asServiceRole.entities.PaymentTransactionLink.filter({
                    transaction_id: tx.id,
                    payment_id: tx.matched_payment_id
                });

                if (existingLinks.length > 0) {
                    console.log(`Link already exists for transaction ${tx.id}`);
                    continue;
                }

                // Get payment to determine expected amount
                const payments = await base44.asServiceRole.entities.Payment.filter({
                    id: tx.matched_payment_id
                });

                if (payments.length === 0) {
                    console.log(`Payment ${tx.matched_payment_id} not found for transaction ${tx.id}`);
                    errorCount++;
                    continue;
                }

                const payment = payments[0];
                const transactionAmount = Math.abs(tx.amount);
                const expectedAmount = payment.expected_amount || 0;
                const linkedAmount = Math.min(transactionAmount, expectedAmount);

                // Create new link
                await base44.asServiceRole.entities.PaymentTransactionLink.create({
                    payment_id: tx.matched_payment_id,
                    transaction_id: tx.id,
                    linked_amount: linkedAmount
                });

                migratedCount++;
                console.log(`Migrated transaction ${tx.id} -> payment ${tx.matched_payment_id}`);
            } catch (error) {
                console.error(`Error migrating transaction ${tx.id}:`, error);
                errorCount++;
            }
        }

        // Now recalculate all payment statuses
        const allPayments = await base44.asServiceRole.entities.Payment.list();
        const allLinks = await base44.asServiceRole.entities.PaymentTransactionLink.list();

        let updatedPayments = 0;

        for (const payment of allPayments) {
            const paymentLinks = allLinks.filter(link => link.payment_id === payment.id);
            const paidAmount = paymentLinks.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
            const expectedAmount = payment.expected_amount || 0;

            let status = 'pending';
            if (paidAmount >= expectedAmount) {
                status = 'paid';
            } else if (paidAmount > 0) {
                status = 'partial';
            }

            // Only update if status or amount changed
            if (payment.status !== status || payment.amount !== paidAmount) {
                await base44.asServiceRole.entities.Payment.update(payment.id, {
                    amount: paidAmount,
                    status: status
                });
                updatedPayments++;
            }
        }

        return Response.json({
            success: true,
            migrated: migratedCount,
            errors: errorCount,
            paymentsUpdated: updatedPayments,
            message: `Migration complete: ${migratedCount} links created, ${updatedPayments} payments updated`
        });
    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({
            error: error.message || 'Migration failed'
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all existing links first (might be empty initially)
        let allLinks = [];
        try {
            allLinks = await base44.asServiceRole.entities.PaymentTransactionLink.list();
        } catch (e) {
            console.log('No existing links found (this is normal for first run)');
        }

        // Get all transactions
        const transactions = await base44.asServiceRole.entities.BankTransaction.list();
        const oldStyleTransactions = transactions.filter(tx => tx.is_categorized && tx.matched_payment_id);

        console.log(`Found ${oldStyleTransactions.length} transactions with old-style payment matching`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const tx of oldStyleTransactions) {
            try {
                // Check if link already exists
                const linkExists = allLinks.some(link => 
                    link.transaction_id === tx.id && link.payment_id === tx.matched_payment_id
                );

                if (linkExists) {
                    console.log(`Link already exists for transaction ${tx.id}`);
                    skippedCount++;
                    continue;
                }

                // Get payment
                const payments = await base44.asServiceRole.entities.Payment.list();
                const payment = payments.find(p => p.id === tx.matched_payment_id);

                if (!payment) {
                    console.log(`Payment ${tx.matched_payment_id} not found for transaction ${tx.id}`);
                    continue;
                }

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
                console.log(`Migrated transaction ${tx.id} -> payment ${tx.matched_payment_id}, amount: ${linkedAmount}`);
            } catch (error) {
                console.error(`Error migrating transaction ${tx.id}:`, error.message);
            }
        }

        // Reload all links after migration
        allLinks = await base44.asServiceRole.entities.PaymentTransactionLink.list();

        // Recalculate all payment statuses
        const allPayments = await base44.asServiceRole.entities.Payment.list();
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

            // Update payment
            await base44.asServiceRole.entities.Payment.update(payment.id, {
                amount: paidAmount,
                status: status
            });
            updatedPayments++;
        }

        return Response.json({
            success: true,
            migrated: migratedCount,
            skipped: skippedCount,
            paymentsUpdated: updatedPayments,
            message: `Migration: ${migratedCount} neue Links, ${skippedCount} übersprungen, ${updatedPayments} Forderungen aktualisiert`
        });
    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});
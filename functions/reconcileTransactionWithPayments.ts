import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId, paymentAllocations, category, unitId, contractId } = await req.json();

        if (!transactionId || !paymentAllocations || !Array.isArray(paymentAllocations)) {
            return Response.json({ error: 'transactionId and paymentAllocations are required' }, { status: 400 });
        }

        // Validate that allocation amounts are positive
        for (const allocation of paymentAllocations) {
            if (!allocation.paymentId || !allocation.amount || allocation.amount <= 0) {
                return Response.json({ error: 'Invalid allocation: paymentId and positive amount required' }, { status: 400 });
            }
        }

        // Get transaction
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter({ id: transactionId });
        if (!transactions || transactions.length === 0) {
            return Response.json({ error: 'Transaction not found' }, { status: 404 });
        }
        const transaction = transactions[0];

        // Calculate total allocation
        const totalAllocated = paymentAllocations.reduce((sum, a) => sum + a.amount, 0);
        const transactionAmount = Math.abs(transaction.amount);

        if (totalAllocated > transactionAmount) {
            return Response.json({ 
                error: `Total allocation (${totalAllocated}) exceeds transaction amount (${transactionAmount})` 
            }, { status: 400 });
        }

        // Delete existing links for this transaction
        const existingLinks = await base44.asServiceRole.entities.PaymentTransactionLink.filter({
            transaction_id: transactionId
        });
        for (const link of existingLinks) {
            await base44.asServiceRole.entities.PaymentTransactionLink.delete(link.id);
        }

        // Create new links
        const affectedPaymentIds = new Set();
        for (const allocation of paymentAllocations) {
            await base44.asServiceRole.entities.PaymentTransactionLink.create({
                payment_id: allocation.paymentId,
                transaction_id: transactionId,
                linked_amount: allocation.amount
            });
            affectedPaymentIds.add(allocation.paymentId);
        }

        // Recalculate payment statuses
        for (const paymentId of affectedPaymentIds) {
            await recalculatePaymentStatus(base44, paymentId);
        }

        // Mark transaction as categorized
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: true,
            category: category || 'rent_income',
            unit_id: unitId || null,
            contract_id: contractId || null
        });

        return Response.json({ 
            success: true,
            message: `Transaction allocated to ${affectedPaymentIds.size} payment(s)`
        });
    } catch (error) {
        console.error('Error reconciling transaction:', error);
        return Response.json({ 
            error: error.message || 'Failed to reconcile transaction' 
        }, { status: 500 });
    }
});

async function recalculatePaymentStatus(base44, paymentId) {
    // Get all links for this payment
    const links = await base44.asServiceRole.entities.PaymentTransactionLink.filter({
        payment_id: paymentId
    });

    // Calculate total paid amount
    const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);

    // Get payment to compare with expected amount
    const payments = await base44.asServiceRole.entities.Payment.filter({ id: paymentId });
    if (payments.length === 0) return;

    const payment = payments[0];
    const expectedAmount = payment.expected_amount || 0;

    // Determine status
    let status = 'pending';
    if (paidAmount >= expectedAmount) {
        status = 'paid';
    } else if (paidAmount > 0) {
        status = 'partial';
    }

    // Update payment
    await base44.asServiceRole.entities.Payment.update(paymentId, {
        amount: paidAmount,
        status: status
    });
}
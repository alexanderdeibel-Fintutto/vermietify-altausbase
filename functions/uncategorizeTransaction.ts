import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId } = await req.json();

        if (!transactionId) {
            return Response.json({ error: 'transactionId is required' }, { status: 400 });
        }

        // Get all links for this transaction
        const links = await base44.asServiceRole.entities.PaymentTransactionLink.filter({
            transaction_id: transactionId
        });

        const affectedPaymentIds = new Set(links.map(link => link.payment_id));

        // Delete all links
        for (const link of links) {
            await base44.asServiceRole.entities.PaymentTransactionLink.delete(link.id);
        }

        // Recalculate payment statuses
        for (const paymentId of affectedPaymentIds) {
            await recalculatePaymentStatus(base44, paymentId);
        }

        // Mark transaction as uncategorized
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: false,
            category: null,
            unit_id: null,
            contract_id: null
        });

        return Response.json({ 
            success: true,
            message: `Transaction uncategorized, ${affectedPaymentIds.size} payment(s) updated`
        });
    } catch (error) {
        console.error('Error uncategorizing transaction:', error);
        return Response.json({ 
            error: error.message || 'Failed to uncategorize transaction' 
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
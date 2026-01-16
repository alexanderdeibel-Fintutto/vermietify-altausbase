import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { transaction_id, amount = null, reason = 'requested_by_customer', reverse_transfer = true } = await req.json();

    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({ id: transaction_id });
        const transaction = transactions[0];

        if (!transaction) {
            return Response.json({ error: 'Transaktion nicht gefunden' }, { status: 404 });
        }

        if (transaction.status === 'REFUNDED') {
            return Response.json({ error: 'Bereits erstattet' }, { status: 400 });
        }

        const refund = await stripe.refunds.create({
            payment_intent: transaction.payment_intent_id,
            amount: amount || undefined,
            reason: reason,
            reverse_transfer: reverse_transfer,
            refund_application_fee: reverse_transfer,
        });

        await base44.asServiceRole.entities.MarketplaceTransaction.update(transaction_id, {
            status: 'REFUNDED',
            refunded_at: new Date().toISOString(),
            metadata: {
                ...transaction.metadata,
                refund_id: refund.id,
                refund_amount: refund.amount,
                refund_reason: reason,
            },
        });

        if (reverse_transfer) {
            const connectedAccount = await base44.asServiceRole.entities.StripeConnectedAccount.filter({
                id: transaction.connected_account_id,
            });

            if (connectedAccount[0]) {
                await base44.asServiceRole.entities.StripeConnectedAccount.update(connectedAccount[0].id, {
                    total_volume: (connectedAccount[0].total_volume || 0) - transaction.total_amount,
                    total_fees_collected: (connectedAccount[0].total_fees_collected || 0) - transaction.application_fee,
                });
            }
        }

        return Response.json({
            success: true,
            refund_id: refund.id,
            amount: refund.amount,
            message: 'Rückerstattung erfolgreich',
        });

    } catch (error) {
        console.error('Refund error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
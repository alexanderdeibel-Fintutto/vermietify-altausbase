import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { order_id, amount, handwerker_id, description, customer_email } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (amount < 100) {
            return Response.json({ error: 'Ungültiger Betrag (minimum 1€)' }, { status: 400 });
        }

        const connectedAccounts = await base44.asServiceRole.entities.StripeConnectedAccount.filter({
            partner_id: handwerker_id,
            partner_type: 'HANDWERKER',
        });

        const connectedAccount = connectedAccounts[0];

        if (!connectedAccount) {
            return Response.json({ error: 'Handwerker hat kein Stripe-Konto' }, { status: 400 });
        }

        if (!connectedAccount.charges_enabled) {
            return Response.json({ error: 'Handwerker kann noch keine Zahlungen empfangen' }, { status: 400 });
        }

        const applicationFeePercent = 10;
        const applicationFeeAmount = Math.round(amount * applicationFeePercent / 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            payment_method_types: ['card', 'sepa_debit'],
            description: description,
            metadata: {
                order_id: order_id,
                handwerker_id: handwerker_id,
                customer_id: user.email,
                fintutto_type: 'HANDWERKER_PAYMENT',
            },
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
                destination: connectedAccount.stripe_account_id,
            },
            statement_descriptor: 'FINTUTTO',
            statement_descriptor_suffix: 'HANDWERK',
        });

        const transaction = await base44.asServiceRole.entities.MarketplaceTransaction.create({
            transaction_type: 'HANDWERKER_PAYMENT',
            order_id: order_id,
            connected_account_id: connectedAccount.id,
            payment_intent_id: paymentIntent.id,
            total_amount: amount,
            application_fee: applicationFeeAmount,
            net_amount: amount - applicationFeeAmount,
            currency: 'EUR',
            status: 'PENDING',
            customer_email: customer_email || user.email,
            description: description,
            metadata: {
                handwerker_id: handwerker_id,
                created_by: user.email,
            },
        });

        return Response.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            transaction_id: transaction.id,
            application_fee: applicationFeeAmount,
            net_amount: amount - applicationFeeAmount,
        });

    } catch (error) {
        console.error('Marketplace payment error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
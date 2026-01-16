import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    try {
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')
        );

        switch (event.type) {
            case 'account.updated': {
                const account = event.data.object;
                const accounts = await base44.asServiceRole.entities.StripeConnectedAccount.filter({
                    stripe_account_id: account.id,
                });

                if (accounts[0]) {
                    await base44.asServiceRole.entities.StripeConnectedAccount.update(accounts[0].id, {
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                        account_status: account.charges_enabled && account.payouts_enabled ? 'ACTIVE' : 'ONBOARDING',
                        onboarding_completed: account.details_submitted,
                        requirements_due: account.requirements?.currently_due || [],
                        requirements_deadline: account.requirements?.current_deadline 
                            ? new Date(account.requirements.current_deadline * 1000).toISOString() 
                            : null,
                    });
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
                    payment_intent_id: paymentIntent.id,
                });

                if (transactions[0]) {
                    await base44.asServiceRole.entities.MarketplaceTransaction.update(transactions[0].id, {
                        status: 'COMPLETED',
                        completed_at: new Date().toISOString(),
                    });

                    const connectedAccount = await base44.asServiceRole.entities.StripeConnectedAccount.filter({
                        id: transactions[0].connected_account_id,
                    });

                    if (connectedAccount[0]) {
                        await base44.asServiceRole.entities.StripeConnectedAccount.update(connectedAccount[0].id, {
                            total_volume: (connectedAccount[0].total_volume || 0) + transactions[0].total_amount,
                            total_fees_collected: (connectedAccount[0].total_fees_collected || 0) + transactions[0].application_fee,
                        });
                    }
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
                    payment_intent_id: paymentIntent.id,
                });

                if (transactions[0]) {
                    await base44.asServiceRole.entities.MarketplaceTransaction.update(transactions[0].id, {
                        status: 'FAILED',
                    });
                }
                break;
            }

            case 'transfer.created': {
                const transfer = event.data.object;
                const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
                    payment_intent_id: transfer.source_transaction,
                });

                if (transactions[0]) {
                    await base44.asServiceRole.entities.MarketplaceTransaction.update(transactions[0].id, {
                        transfer_id: transfer.id,
                    });
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 400 });
    }
});
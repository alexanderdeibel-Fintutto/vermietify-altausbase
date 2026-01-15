import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const rawBody = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return new Response(JSON.stringify({ error: 'Keine Webhook-Signatur' }), { status: 400 });
        }

        const stripe = (await import('npm:stripe@13.0.0')).default;
        const stripeClient = stripe(Deno.env.get('STRIPE_SECRET_KEY'));

        let event;
        try {
            event = await stripeClient.webhooks.constructEventAsync(
                rawBody,
                signature,
                Deno.env.get('STRIPE_WEBHOOK_SECRET')
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return new Response(JSON.stringify({ error: 'Signature verification failed' }), { status: 400 });
        }

        // Event speichern (Idempotenz)
        const existingEvent = await base44.asServiceRole.entities.StripeEvent.filter({
            stripe_event_id: event.id
        });

        if (existingEvent && existingEvent.length > 0 && existingEvent[0].processed) {
            return new Response(JSON.stringify({ status: 'already_processed' }), { status: 200 });
        }

        const storedEvent = await base44.asServiceRole.entities.StripeEvent.create({
            stripe_event_id: event.id,
            event_type: event.type,
            event_data: JSON.stringify(event.data),
            processed: false
        });

        // Event verarbeiten
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userEmail = session.metadata.user_email;
                const planId = session.metadata.plan_id;
                const billingCycle = session.metadata.billing_cycle;

                const subscription = await stripeClient.subscriptions.retrieve(session.subscription);

                const existingSub = await base44.asServiceRole.entities.UserSubscription.filter({
                    user_email: userEmail
                });

                const subData = {
                    user_email: userEmail,
                    plan_id: planId,
                    status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
                    billing_cycle: billingCycle,
                    start_date: new Date(),
                    next_billing_date: new Date(subscription.current_period_end * 1000),
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: session.customer
                };

                if (existingSub && existingSub.length > 0) {
                    await base44.asServiceRole.entities.UserSubscription.update(existingSub[0].id, subData);
                } else {
                    await base44.asServiceRole.entities.UserSubscription.create(subData);
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object;
                const subscription = await stripeClient.subscriptions.retrieve(invoice.subscription);

                const userSub = await base44.asServiceRole.entities.UserSubscription.filter({
                    stripe_subscription_id: invoice.subscription
                });

                if (userSub && userSub.length > 0) {
                    await base44.asServiceRole.entities.UserSubscription.update(userSub[0].id, {
                        status: 'ACTIVE',
                        next_billing_date: new Date(subscription.current_period_end * 1000)
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;

                const userSub = await base44.asServiceRole.entities.UserSubscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (userSub && userSub.length > 0) {
                    await base44.asServiceRole.entities.UserSubscription.update(userSub[0].id, {
                        status: 'CANCELLED',
                        end_date: new Date()
                    });
                }
                break;
            }
        }

        // Event als verarbeitet markieren
        await base44.asServiceRole.entities.StripeEvent.update(storedEvent.id, {
            processed: true,
            processed_at: new Date()
        });

        return new Response(JSON.stringify({ status: 'processed', eventType: event.type }), { status: 200 });

    } catch (error) {
        console.error('Error handling webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
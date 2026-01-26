import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { planId, billingCycle } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const plan = await base44.entities.SubscriptionPlan.get(planId);
        if (!plan) {
            return new Response(JSON.stringify({ error: 'Plan nicht gefunden' }), { status: 404 });
        }

        const priceId = billingCycle === 'YEARLY'
            ? plan.stripe_price_id_yearly
            : plan.stripe_price_id_monthly;

        if (!priceId) {
            return new Response(JSON.stringify({ error: 'Stripe-Preis nicht konfiguriert' }), { status: 400 });
        }

        // Bestehende Subscription prüfen
        let customerId = null;
        const existingSub = await base44.entities.UserSubscription.filter({
            user_email: user.email,
            status: { $in: ['ACTIVE', 'TRIAL', 'PAUSED'] }
        });

        if (existingSub && existingSub.length > 0 && existingSub[0].stripe_customer_id) {
            customerId = existingSub[0].stripe_customer_id;
        }

        // Stripe Checkout Session erstellen
        const stripe = (await import('npm:stripe@13.0.0')).default;
        const stripeClient = stripe(Deno.env.get('STRIPE_SECRET_KEY'));

        const session = await stripeClient.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card', 'sepa_debit'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${Deno.env.get('APP_URL')}/settings/subscription?success=true`,
            cancel_url: `${Deno.env.get('APP_URL')}/pricing?cancelled=true`,
            customer_email: customerId ? undefined : user.email,
            customer: customerId || undefined,
            metadata: {
                user_email: user.email,
                plan_id: planId,
                billing_cycle: billingCycle
            },
            locale: 'de',
            billing_address_collection: 'required'
        });

        return new Response(JSON.stringify({
            sessionId: session.id,
            url: session.url
        }), { status: 200 });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
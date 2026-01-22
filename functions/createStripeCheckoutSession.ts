import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, billing_cycle } = await req.json();

    // Get plan details
    const plan = await base44.entities.SubscriptionPlan.get(plan_id);
    
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Determine price
    const priceId = billing_cycle === 'YEARLY' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly;

    if (!priceId) {
      return Response.json({ error: 'Price ID not configured' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/BillingSuccess`,
      cancel_url: `${req.headers.get('origin')}/Billing`,
      customer_email: user.email,
      metadata: {
        user_email: user.email,
        plan_id: plan_id,
        billing_cycle: billing_cycle
      }
    });

    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
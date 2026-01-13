import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

  const { plan_id, addon_ids = [], billing_cycle = 'monthly', success_url, cancel_url } = await req.json();

  try {
    const plans = await base44.entities.SubscriptionPlan.filter({ id: plan_id });
    const plan = plans[0];
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const lineItems = [];
    
    const planPriceId = billing_cycle === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly;
    
    if (!planPriceId) {
      return Response.json({ error: 'Stripe price not configured for plan' }, { status: 400 });
    }
    
    lineItems.push({ price: planPriceId, quantity: 1 });

    for (const addonId of addon_ids) {
      const pricings = await base44.entities.PlanAddOnPricing.filter({
        plan_id: plan_id,
        addon_id: addonId
      });
      const pricing = pricings[0];
      
      if (pricing && pricing.is_available && !pricing.is_included && pricing.stripe_price_id) {
        lineItems.push({ price: pricing.stripe_price_id, quantity: 1 });
      }
    }

    let customerId;
    
    const existingSubs = await base44.entities.UserSubscription.filter({
      user_email: user.email
    });
    
    if (existingSubs[0]?.stripe_customer_id) {
      customerId = existingSubs[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { base44_user_email: user.email }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      subscription_data: {
        trial_period_days: plan.trial_days || 0,
        metadata: {
          base44_user_email: user.email,
          base44_plan_id: plan_id,
          base44_addon_ids: JSON.stringify(addon_ids),
          base44_billing_cycle: billing_cycle
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      locale: 'de'
    });

    return Response.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: 'Failed to create checkout session', details: error.message }, { status: 500 });
  }
});
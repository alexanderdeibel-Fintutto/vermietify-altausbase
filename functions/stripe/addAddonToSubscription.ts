import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const { addon_id } = await req.json();

  try {
    const subscriptions = await base44.entities.UserSubscription.filter({
      user_email: user.email,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscriptions[0]) {
      return Response.json({ error: 'No active subscription' }, { status: 404 });
    }

    const sub = subscriptions[0];

    const pricings = await base44.entities.PlanAddOnPricing.filter({
      plan_id: sub.plan_id,
      addon_id: addon_id
    });

    const pricing = pricings[0];
    if (!pricing || !pricing.is_available) {
      return Response.json({ error: 'Add-on not available for this plan' }, { status: 400 });
    }

    if (pricing.is_included) {
      return Response.json({ error: 'Add-on already included in plan' }, { status: 400 });
    }

    if (!pricing.stripe_price_id) {
      return Response.json({ error: 'Stripe price not configured for add-on' }, { status: 400 });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: sub.stripe_subscription_id,
      price: pricing.stripe_price_id,
      quantity: 1
    });

    await base44.entities.UserAddOn.create({
      user_email: user.email,
      subscription_id: sub.id,
      addon_id: addon_id,
      status: 'active',
      price_at_purchase: pricing.price_monthly,
      activated_at: new Date().toISOString(),
      stripe_subscription_item_id: subscriptionItem.id,
      is_included_in_plan: false
    });

    return Response.json({ success: true, item_id: subscriptionItem.id });

  } catch (error) {
    console.error('Add addon error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
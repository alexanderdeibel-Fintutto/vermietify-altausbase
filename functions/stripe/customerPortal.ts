import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const { return_url } = await req.json();

  try {
    const subscriptions = await base44.entities.UserSubscription.filter({
      user_email: user.email
    });

    if (!subscriptions[0]?.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscriptions[0].stripe_customer_id,
      return_url: return_url || `${req.headers.get('origin')}/settings/subscription`
    });

    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Customer portal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
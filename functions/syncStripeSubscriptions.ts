import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const subscriptions = stripe.subscriptions.list({ limit: 100 });
    let synced = 0;

    for await (const subscription of subscriptions) {
      const userEmail = subscription.metadata?.user_email;
      if (!userEmail) continue;

      await base44.asServiceRole.entities.UserSubscription.create({
        user_email: userEmail,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
        plan_id: subscription.metadata?.plan_id || 'unknown',
        billing_cycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY',
        start_date: new Date(subscription.created * 1000).toISOString(),
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
      });
      
      synced++;
    }

    return Response.json({ success: true, synced });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
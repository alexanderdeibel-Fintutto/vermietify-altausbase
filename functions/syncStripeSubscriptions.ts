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
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all Stripe subscriptions
    const stripeSubscriptions = await stripe.subscriptions.list({ limit: 100 });
    
    let synced = 0;
    let errors = 0;

    for (const stripeSub of stripeSubscriptions.data) {
      try {
        const customer = await stripe.customers.retrieve(stripeSub.customer);
        const email = customer.email;

        if (!email) continue;

        // Check if subscription exists in our DB
        const existing = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: stripeSub.id
        });

        const status = stripeSub.status === 'active' ? 'ACTIVE' :
                      stripeSub.status === 'trialing' ? 'TRIAL' :
                      stripeSub.status === 'canceled' ? 'CANCELLED' : 'PAUSED';

        const subData = {
          user_email: email,
          status,
          stripe_subscription_id: stripeSub.id,
          stripe_customer_id: stripeSub.customer,
          next_billing_date: new Date(stripeSub.current_period_end * 1000).toISOString()
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, subData);
        }
        
        synced++;
      } catch (err) {
        errors++;
        console.error('Error syncing subscription:', err);
      }
    }

    return Response.json({ 
      success: true, 
      synced,
      errors
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
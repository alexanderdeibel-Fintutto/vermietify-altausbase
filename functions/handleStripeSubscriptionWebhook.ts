import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    // Initialize Base44 client first
    const base44 = createClientFromRequest(req);

    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_email, plan_id, billing_cycle } = session.metadata;

        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Create or update UserSubscription
        const existing = await base44.asServiceRole.entities.UserSubscription.filter({ user_email });
        
        const subscriptionData = {
          user_email,
          plan_id,
          status: 'ACTIVE',
          billing_cycle,
          start_date: new Date().toISOString(),
          next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          payment_method: session.payment_method_types[0] === 'card' ? 'CREDIT_CARD' : 'SEPA'
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, subscriptionData);
        } else {
          await base44.asServiceRole.entities.UserSubscription.create(subscriptionData);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        const existing = await base44.asServiceRole.entities.UserSubscription.filter({ 
          stripe_subscription_id: subscription.id 
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
            status: subscription.status === 'active' ? 'ACTIVE' : 
                    subscription.status === 'canceled' ? 'CANCELLED' : 
                    subscription.status === 'paused' ? 'PAUSED' : 'EXPIRED',
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const existing = await base44.asServiceRole.entities.UserSubscription.filter({ 
          stripe_subscription_id: subscription.id 
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
            status: 'CANCELLED',
            end_date: new Date().toISOString()
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
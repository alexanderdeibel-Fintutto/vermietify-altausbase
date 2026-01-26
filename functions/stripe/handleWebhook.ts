import Stripe from 'https://esm.sh/stripe@14.8.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;

      case 'price.updated':
        // Sync price updates
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleSubscriptionChange(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        metadata: subscription.metadata
      }, { onConflict: 'stripe_subscription_id' });

    if (error) throw error;
    console.log(`Subscription ${subscription.id} synced`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;
    console.log(`Subscription ${subscription.id} cancelled`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

async function handleChargeSucceeded(charge) {
  try {
    const { error } = await supabase
      .from('payments')
      .insert({
        stripe_charge_id: charge.id,
        stripe_customer_id: charge.customer,
        amount: charge.amount / 100, // Convert from cents
        currency: charge.currency.toUpperCase(),
        status: 'succeeded',
        metadata: charge.metadata
      });

    if (error) throw error;
    console.log(`Payment ${charge.id} recorded`);
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
    throw error;
  }
}

async function handleChargeFailed(charge) {
  try {
    const { error } = await supabase
      .from('payments')
      .insert({
        stripe_charge_id: charge.id,
        stripe_customer_id: charge.customer,
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: 'failed',
        metadata: charge.metadata
      });

    if (error) throw error;
    console.log(`Failed payment ${charge.id} recorded`);
  } catch (error) {
    console.error('Error handling charge failed:', error);
    throw error;
  }
}
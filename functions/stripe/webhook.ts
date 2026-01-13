import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  
  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        
        const userEmail = session.metadata?.base44_user_email;
        const planId = session.metadata?.base44_plan_id;
        const addonIds = JSON.parse(session.metadata?.base44_addon_ids || '[]');
        const billingCycle = session.metadata?.base44_billing_cycle || 'monthly';
        
        if (!userEmail || !planId) break;
        
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

        const existingSubs = await base44.asServiceRole.entities.UserSubscription.filter({ user_email: userEmail });

        const subscriptionData = {
          user_email: userEmail,
          plan_id: planId,
          status: stripeSubscription.status === 'trialing' ? 'trialing' : 'active',
          billing_cycle: billingCycle,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
          trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
          trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null
        };

        let subscriptionId;
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(existingSubs[0].id, subscriptionData);
          subscriptionId = existingSubs[0].id;
        } else {
          const newSub = await base44.asServiceRole.entities.UserSubscription.create(subscriptionData);
          subscriptionId = newSub.id;
        }

        for (const addonId of addonIds) {
          const pricings = await base44.asServiceRole.entities.PlanAddOnPricing.filter({
            plan_id: planId,
            addon_id: addonId
          });
          const pricing = pricings[0];

          if (pricing && !pricing.is_included) {
            await base44.asServiceRole.entities.UserAddOn.create({
              user_email: userEmail,
              subscription_id: subscriptionId,
              addon_id: addonId,
              status: 'active',
              price_at_purchase: pricing.price_monthly,
              activated_at: new Date().toISOString(),
              is_included_in_plan: false
            });
          }
        }

        const includedAddons = await base44.asServiceRole.entities.PlanAddOnPricing.filter({
          plan_id: planId,
          is_included: true
        });

        for (const included of includedAddons) {
          const existingUserAddon = await base44.asServiceRole.entities.UserAddOn.filter({
            user_email: userEmail,
            addon_id: included.addon_id
          });

          if (existingUserAddon.length === 0) {
            await base44.asServiceRole.entities.UserAddOn.create({
              user_email: userEmail,
              subscription_id: subscriptionId,
              addon_id: included.addon_id,
              status: 'active',
              price_at_purchase: 0,
              activated_at: new Date().toISOString(),
              is_included_in_plan: true
            });
          }
        }

        console.log(`Subscription created for ${userEmail}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userEmail = subscription.metadata?.base44_user_email;
        if (!userEmail) break;

        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscription.id
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          });
        }

        console.log(`Subscription updated for ${userEmail}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userEmail = subscription.metadata?.base44_user_email;
        if (!userEmail) break;

        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscription.id
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            status: 'canceled',
            canceled_at: new Date().toISOString()
          });

          await base44.asServiceRole.entities.UserAddOn.update({
            subscription_id: userSubs[0].id
          }, {
            status: 'canceled',
            canceled_at: new Date().toISOString()
          });
        }

        console.log(`Subscription canceled for ${userEmail}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const userEmail = invoice.customer_email;

        await base44.asServiceRole.entities.SubscriptionInvoice.create({
          user_email: userEmail,
          stripe_invoice_id: invoice.id,
          invoice_number: invoice.number,
          status: 'paid',
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          period_start: new Date(invoice.period_start * 1000).toISOString(),
          period_end: new Date(invoice.period_end * 1000).toISOString(),
          invoice_pdf_url: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url,
          line_items_json: JSON.stringify(invoice.lines.data)
        });

        console.log(`Invoice logged for ${userEmail}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userEmail = invoice.customer_email;

        const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
          user_email: userEmail,
          stripe_customer_id: invoice.customer
        });

        if (userSubs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(userSubs[0].id, {
            status: 'past_due'
          });
        }

        console.log(`Payment failed for ${userEmail}`);
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
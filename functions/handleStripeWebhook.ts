import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const packageType = subscription.metadata?.package_type;
        const addonId = subscription.metadata?.addon_id;

        if (!userId) break;

        if (packageType) {
          // Paket Update
          const userPackage = await base44.asServiceRole.entities.UserPackageConfiguration.filter({
            user_id: userId
          });

          if (userPackage.length > 0) {
            await base44.asServiceRole.entities.UserPackageConfiguration.update(userPackage[0].id, {
              is_active: subscription.status === 'active'
            });
          }
        }

        if (addonId) {
          // Add-on hinzufügen
          const userPackage = await base44.asServiceRole.entities.UserPackageConfiguration.filter({
            user_id: userId
          });

          if (userPackage.length > 0) {
            const current = userPackage[0];
            const modules = current.additional_modules || [];
            if (!modules.includes(addonId)) {
              modules.push(addonId);
              await base44.asServiceRole.entities.UserPackageConfiguration.update(current.id, {
                additional_modules: modules
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const addonId = subscription.metadata?.addon_id;

        if (!userId) break;

        if (addonId) {
          // Add-on entfernen
          const userPackage = await base44.asServiceRole.entities.UserPackageConfiguration.filter({
            user_id: userId
          });

          if (userPackage.length > 0) {
            const current = userPackage[0];
            const modules = (current.additional_modules || []).filter(m => m !== addonId);
            await base44.asServiceRole.entities.UserPackageConfiguration.update(current.id, {
              additional_modules: modules
            });
          }
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
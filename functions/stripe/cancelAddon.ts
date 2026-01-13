import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const { user_addon_id } = await req.json();

  try {
    const userAddons = await base44.entities.UserAddOn.filter({
      id: user_addon_id,
      user_email: user.email
    });

    if (!userAddons[0]) {
      return Response.json({ error: 'Add-on not found' }, { status: 404 });
    }

    const userAddon = userAddons[0];

    if (userAddon.is_included_in_plan) {
      return Response.json({ error: 'Cannot cancel included add-on' }, { status: 400 });
    }

    if (userAddon.stripe_subscription_item_id) {
      await stripe.subscriptionItems.del(userAddon.stripe_subscription_item_id);
    }

    await base44.entities.UserAddOn.update(userAddon.id, {
      status: 'canceled',
      canceled_at: new Date().toISOString()
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Cancel addon error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
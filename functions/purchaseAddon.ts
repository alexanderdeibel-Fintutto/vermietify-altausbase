import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { addon_id } = await req.json();

    // Addon-Preise definieren
    const addonPrices = {
      'dokumentation': 999, // €9.99 in cents
      'kommunikation': 1499,
      'aufgaben': 1299
    };

    const price = addonPrices[addon_id];
    if (!price) {
      return Response.json({ error: 'Invalid addon' }, { status: 400 });
    }

    // Stripe Customer oder erstellen
    let stripeCustomerId = null;
    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomer.data.length > 0) {
      stripeCustomerId = existingCustomer.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
    }

    // Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Add-on: ${addon_id}`,
              metadata: { addon_id }
            },
            recurring: {
              interval: 'month'
            },
            unit_amount: price
          },
          quantity: 1
        }
      ],
      success_url: `${new URL(req.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/cancel`,
      metadata: {
        userId: user.id,
        addon_id
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Addon Purchase Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
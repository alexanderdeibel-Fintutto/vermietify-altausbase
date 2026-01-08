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

    const { package_type } = await req.json();

    // Paket-Preise definieren (monthly)
    const packagePrices = {
      'easyKonto': 0,
      'easySteuer': 1999,
      'easyHome': 2999,
      'easyVermieter': 3999,
      'easyGewerbe': 5999
    };

    const price = packagePrices[package_type];
    if (price === undefined) {
      return Response.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Paket-Limits definieren
    const packageLimits = {
      'easyKonto': { buildings: 0, units: 0 },
      'easySteuer': { buildings: 0, units: 0 },
      'easyHome': { buildings: 1, units: 10 },
      'easyVermieter': { buildings: 1, units: 999 },
      'easyGewerbe': { buildings: 5, units: 999 }
    };

    // Stripe Customer finden
    let stripeCustomerId = null;
    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomer.data.length > 0) {
      stripeCustomerId = existingCustomer.data[0].id;
    } else if (price > 0) {
      // Nur Checkout Session wenn nicht kostenlos
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Paket: ${package_type}`
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
          package_type
        }
      });

      return Response.json({ checkoutUrl: session.url });
    }

    // Paket-Konfiguration aktualisieren
    const limits = packageLimits[package_type];
    const userPackage = await base44.entities.UserPackageConfiguration.filter({
      user_id: user.id
    });

    if (userPackage.length > 0) {
      await base44.entities.UserPackageConfiguration.update(userPackage[0].id, {
        package_type,
        max_buildings: limits.buildings,
        max_units: limits.units,
        price_per_month: price / 100
      });
    } else {
      await base44.entities.UserPackageConfiguration.create({
        user_id: user.id,
        package_type,
        max_buildings: limits.buildings,
        max_units: limits.units,
        price_per_month: price / 100
      });
    }

    return Response.json({ success: true, package_type });
  } catch (error) {
    console.error('Package Switch Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ 
        error: 'STRIPE_SECRET_KEY nicht konfiguriert',
        hint: 'Bitte Secret in den Settings setzen'
      }, { status: 500 });
    }

    const plans = await base44.asServiceRole.entities.SubscriptionPlan.list();
    const syncResults = [];

    for (const plan of plans) {
      try {
        // Produkt in Stripe anlegen falls noch nicht vorhanden
        let stripeProductId = plan.stripe_product_id;
        
        if (!stripeProductId) {
          const productRes = await fetch('https://api.stripe.com/v1/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              name: plan.name,
              description: plan.description || '',
              metadata: JSON.stringify({ plan_id: plan.id })
            })
          });

          if (!productRes.ok) {
            throw new Error(`Stripe Product Error: ${await productRes.text()}`);
          }

          const product = await productRes.json();
          stripeProductId = product.id;
        }

        // Monthly Price anlegen
        let monthlyPriceId = plan.stripe_price_id_monthly;
        if (!monthlyPriceId && plan.price_monthly > 0) {
          const priceRes = await fetch('https://api.stripe.com/v1/prices', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              product: stripeProductId,
              unit_amount: String(plan.price_monthly),
              currency: 'eur',
              recurring: JSON.stringify({ interval: 'month' }),
              metadata: JSON.stringify({ plan_id: plan.id, billing_cycle: 'monthly' })
            })
          });

          if (!priceRes.ok) {
            throw new Error(`Stripe Price Error: ${await priceRes.text()}`);
          }

          const price = await priceRes.json();
          monthlyPriceId = price.id;
        }

        // Yearly Price anlegen
        let yearlyPriceId = plan.stripe_price_id_yearly;
        if (!yearlyPriceId && plan.price_yearly > 0) {
          const priceRes = await fetch('https://api.stripe.com/v1/prices', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              product: stripeProductId,
              unit_amount: String(plan.price_yearly),
              currency: 'eur',
              recurring: JSON.stringify({ interval: 'year' }),
              metadata: JSON.stringify({ plan_id: plan.id, billing_cycle: 'yearly' })
            })
          });

          if (!priceRes.ok) {
            throw new Error(`Stripe Price Error: ${await priceRes.text()}`);
          }

          const price = await priceRes.json();
          yearlyPriceId = price.id;
        }

        // Plan aktualisieren mit Stripe IDs
        await base44.asServiceRole.entities.SubscriptionPlan.update(plan.id, {
          stripe_product_id: stripeProductId,
          stripe_price_id_monthly: monthlyPriceId,
          stripe_price_id_yearly: yearlyPriceId
        });

        syncResults.push({
          plan: plan.name,
          success: true,
          stripe_product_id: stripeProductId,
          stripe_price_id_monthly: monthlyPriceId,
          stripe_price_id_yearly: yearlyPriceId
        });

      } catch (error) {
        syncResults.push({
          plan: plan.name,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({ 
      success: true, 
      results: syncResults,
      total: plans.length,
      synced: syncResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
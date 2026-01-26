import Stripe from 'https://esm.sh/stripe@14.8.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Syncs Stripe pricing to Supabase database
 * Run this when Stripe prices are updated
 */
Deno.serve(async (req) => {
  try {
    // Get all active prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    let synced = 0;
    let errors = 0;

    for (const price of prices.data) {
      try {
        const product = price.product;

        // Skip if not a FinTuttO app
        if (!product.metadata?.app_id) continue;

        // Prepare price data
        const priceData = {
          stripe_price_id: price.id,
          stripe_product_id: product.id,
          app_id: product.metadata.app_id,
          currency: price.currency?.toUpperCase(),
          amount: price.unit_amount,
          interval: price.recurring?.interval,
          interval_count: price.recurring?.interval_count || 1,
          tier_name: product.metadata.tier_name,
          description: price.nickname || product.description,
          active: price.active,
          livemode: price.livemode,
          metadata: product.metadata
        };

        // Upsert price in database
        const { error } = await supabase
          .from('stripe_prices')
          .upsert(priceData, { onConflict: 'stripe_price_id' });

        if (error) {
          console.error(`Error syncing price ${price.id}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (error) {
        console.error(`Error processing price:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      synced,
      errors,
      total: prices.data.length
    });
  } catch (error) {
    console.error('Error syncing prices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
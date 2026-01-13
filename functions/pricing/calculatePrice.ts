import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, tier_id, billing_interval = 'MONTHLY', addon_ids = [], promo_code = null, quantity = {} } = body;

    // Fetch pricing data
    const tier = await base44.entities.PricingTier.read(tier_id);
    const tierFeatures = await base44.entities.TierFeature.filter({ tier_id });
    const addons = addon_ids.length > 0 ? await Promise.all(addon_ids.map(id => base44.entities.Feature.read(id))) : [];
    
    let basePrice = billing_interval === 'YEARLY' ? (tier.data.price_yearly || tier.data.price_monthly * 12) : tier.data.price_monthly;
    let addonsPrice = 0;
    let discounts = [];

    // Add-ons pricing
    for (const addon of addons) {
      const tierFeature = tierFeatures.find(tf => tf.data.feature_id === addon.id);
      if (tierFeature?.data.addon_price_monthly) {
        const addonPrice = billing_interval === 'YEARLY' ? (tierFeature.data.addon_price_yearly || tierFeature.data.addon_price_monthly * 12) : tierFeature.data.addon_price_monthly;
        addonsPrice += addonPrice;
      }
    }

    // Promo code
    let discountAmount = 0;
    if (promo_code) {
      const discount = await base44.entities.Discount.filter({ promo_code });
      if (discount.length > 0) {
        const discountData = discount[0].data;
        if (discountData.discount_type === 'PERCENT') {
          discountAmount = Math.round((basePrice + addonsPrice) * (discountData.discount_value / 100));
        } else if (discountData.discount_type === 'FIXED_AMOUNT') {
          discountAmount = discountData.discount_value;
        }
        discounts.push({
          code: promo_code,
          amount: discountAmount,
          type: discountData.discount_type
        });
      }
    }

    const finalPrice = Math.max(0, basePrice + addonsPrice - discountAmount);

    return Response.json({
      base_price: basePrice,
      addons_price: addonsPrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      billing_interval,
      discounts,
      currency: 'EUR'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
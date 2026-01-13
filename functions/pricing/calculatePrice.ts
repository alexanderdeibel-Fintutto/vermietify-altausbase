import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  try {
    const { 
      tier_id, 
      billing_cycle = 'MONTHLY',
      addon_ids = [],
      quantities = {},
      promo_code 
    } = await req.json();
    
    // Tier laden
    const tiers = await base44.asServiceRole.entities.PricingTier.filter({ id: tier_id });
    const tier = tiers[0];
    
    if (!tier) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }
    
    // Basis-Preis
    let basePrice = billing_cycle === 'YEARLY' && tier.data.price_yearly 
      ? tier.data.price_yearly 
      : tier.data.price_monthly * 12;
    
    if (billing_cycle === 'MONTHLY') {
      basePrice = tier.data.price_monthly;
    }
    
    const breakdown = {
      base_price: basePrice,
      addons: [],
      quantity_charges: [],
      discounts: [],
      subtotal: basePrice,
      total: basePrice
    };
    
    // Add-Ons hinzufügen
    for (const addonId of addon_ids) {
      const tierFeatures = await base44.asServiceRole.entities.TierFeature.filter({
        tier_id: tier_id,
        feature_id: addonId,
        inclusion_type: 'AVAILABLE'
      });
      
      const tierFeature = tierFeatures[0];
      if (tierFeature) {
        const addonPrice = tierFeature.data.price_override || 0;
        breakdown.addons.push({
          feature_id: addonId,
          price: billing_cycle === 'MONTHLY' ? addonPrice : addonPrice * 12,
          name: tierFeature.data.feature_id
        });
        breakdown.subtotal += (billing_cycle === 'MONTHLY' ? addonPrice : addonPrice * 12);
      }
    }
    
    // Mengen-Zuschläge berechnen
    for (const [limitKey, quantity] of Object.entries(quantities)) {
      const tierLimits = await base44.asServiceRole.entities.TierLimit.filter({
        tier_id: tier_id
      });
      
      const tierLimit = tierLimits.find(tl => tl.data.limit_id === limitKey);
      if (tierLimit && tierLimit.data.limit_value !== -1) {
        const excess = Math.max(0, quantity - tierLimit.data.limit_value);
        if (excess > 0) {
          // TODO: Overage-Preis aus UsageLimit laden
          breakdown.quantity_charges.push({
            limit_key: limitKey,
            excess: excess,
            price_per_unit: 0,
            total: 0
          });
        }
      }
    }
    
    // Rabatte anwenden
    const discounts = await base44.asServiceRole.entities.Discount.filter({
      is_active: true
    });
    
    for (const discount of discounts) {
      let applies = false;
      
      // Prüfen ob Rabatt gilt
      if (discount.data.applies_to === 'ALL') {
        applies = true;
      } else if (discount.data.applies_to === 'TIER') {
        const ids = JSON.parse(discount.data.applies_to_ids || '[]');
        applies = ids.includes(tier_id);
      }
      
      // Bedingung prüfen
      if (applies && discount.data.condition_type === 'BILLING_INTERVAL') {
        const conditionValue = JSON.parse(discount.data.condition_value || '{}');
        if (conditionValue.interval !== billing_cycle) {
          applies = false;
        }
      }
      
      if (applies && discount.data.condition_type === 'PROMO_CODE') {
        if (discount.data.promo_code !== promo_code) {
          applies = false;
        }
      }
      
      // Rabatt anwenden
      if (applies) {
        let discountAmount = 0;
        
        if (discount.data.discount_type === 'PERCENT') {
          discountAmount = Math.round(breakdown.subtotal * discount.data.discount_value / 100);
        } else if (discount.data.discount_type === 'FIXED_AMOUNT') {
          discountAmount = discount.data.discount_value;
        }
        
        breakdown.discounts.push({
          code: discount.data.discount_code,
          name: discount.data.name,
          amount: discountAmount,
          type: discount.data.discount_type
        });
        
        breakdown.subtotal -= discountAmount;
      }
    }
    
    breakdown.total = Math.max(0, breakdown.subtotal);
    
    // Ersparnis berechnen
    const fullPrice = basePrice + breakdown.addons.reduce((sum, a) => sum + a.price, 0);
    const savings = fullPrice - breakdown.total;
    const savingsPercent = fullPrice > 0 ? Math.round((savings / fullPrice) * 100) : 0;
    
    return Response.json({
      success: true,
      breakdown,
      savings: {
        amount: savings,
        percent: savingsPercent
      },
      billing_cycle,
      monthly_equivalent: billing_cycle === 'YEARLY' ? Math.round(breakdown.total / 12) : breakdown.total
    });
    
  } catch (error) {
    console.error('Price calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
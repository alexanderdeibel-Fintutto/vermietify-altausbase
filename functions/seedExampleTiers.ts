import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get Vermieter Pro Product
    const products = await base44.asServiceRole.entities.Product.filter({ 
      product_code: 'VERMIETER_PRO' 
    });
    const product = products[0];

    if (!product) {
      return Response.json({ error: 'Product VERMIETER_PRO not found' }, { status: 404 });
    }

    // Create 3 Tiers: FREE, STARTER, PRO
    const tierData = [
      {
        product_id: product.id,
        tier_code: 'FREE',
        name: 'Free',
        description: 'Perfekt zum Ausprobieren - kostenlos für immer',
        tier_level: 1,
        price_monthly: 0,
        price_yearly: 0,
        is_active: true,
        is_default: true,
        is_popular: false,
        trial_days: 0,
        max_users: 1,
        sort_order: 1
      },
      {
        product_id: product.id,
        tier_code: 'STARTER',
        name: 'Starter',
        description: 'Ideal für Privatvermieter mit wenigen Objekten',
        tier_level: 2,
        price_monthly: 1990,
        price_yearly: 19900,
        is_active: true,
        is_default: false,
        is_popular: true,
        trial_days: 14,
        max_users: 2,
        sort_order: 2,
        badge_text: 'BELIEBT'
      },
      {
        product_id: product.id,
        tier_code: 'PRO',
        name: 'Professional',
        description: 'Für professionelle Vermieter und Hausverwaltungen',
        tier_level: 3,
        price_monthly: 4990,
        price_yearly: 49900,
        is_active: true,
        is_default: false,
        is_popular: false,
        trial_days: 14,
        max_users: -1,
        sort_order: 3
      }
    ];

    const createdTiers = await base44.asServiceRole.entities.PricingTier.bulkCreate(tierData);

    // Get all limits and features
    const limits = await base44.asServiceRole.entities.UsageLimit.list();
    const features = await base44.asServiceRole.entities.Feature.list();

    // Configure Limits for each tier
    const limitConfigs = {
      FREE: {
        MAX_OBJECTS: 1,
        MAX_UNITS: 3,
        MAX_TENANTS: 3,
        MAX_DOCUMENTS: 50,
        FEATURE_BANK_API: 0,
        FEATURE_AI_BOOKING: 0,
        FEATURE_ANLAGE_V: 0,
        FEATURE_SUPPORT_PRIORITY: 0
      },
      STARTER: {
        MAX_OBJECTS: 3,
        MAX_UNITS: 10,
        MAX_TENANTS: 10,
        MAX_DOCUMENTS: 500,
        FEATURE_BANK_API: 1,
        FEATURE_AI_BOOKING: 0,
        FEATURE_ANLAGE_V: 1,
        FEATURE_SUPPORT_PRIORITY: 0
      },
      PRO: {
        MAX_OBJECTS: -1,
        MAX_UNITS: -1,
        MAX_TENANTS: -1,
        MAX_DOCUMENTS: -1,
        FEATURE_BANK_API: 1,
        FEATURE_AI_BOOKING: 1,
        FEATURE_ANLAGE_V: 1,
        FEATURE_SUPPORT_PRIORITY: 1
      }
    };

    const tierLimitsToCreate = [];
    for (const tier of createdTiers) {
      const config = limitConfigs[tier.tier_code];
      for (const [limitCode, limitValue] of Object.entries(config)) {
        const limit = limits.find(l => l.limit_code === limitCode);
        if (limit) {
          tierLimitsToCreate.push({
            tier_id: tier.id,
            limit_id: limit.id,
            limit_value: limitValue
          });
        }
      }
    }

    await base44.asServiceRole.entities.TierLimit.bulkCreate(tierLimitsToCreate);

    // Configure Features for each tier
    const featureConfigs = {
      FREE: {
        OBJ_1: { inclusion_type: 'INCLUDED', quantity_limit: 1 },
        TENANT_BASE: { inclusion_type: 'INCLUDED' },
        LEASE_MGMT: { inclusion_type: 'INCLUDED' },
        INCOME_EXP: { inclusion_type: 'INCLUDED' }
      },
      STARTER: {
        OBJ_3: { inclusion_type: 'INCLUDED', quantity_limit: 3 },
        TENANT_BASE: { inclusion_type: 'INCLUDED' },
        LEASE_MGMT: { inclusion_type: 'INCLUDED' },
        DEPOSIT: { inclusion_type: 'INCLUDED' },
        INCOME_EXP: { inclusion_type: 'INCLUDED' },
        BANK_CSV: { inclusion_type: 'INCLUDED' },
        METER_MGMT: { inclusion_type: 'AVAILABLE' },
        RENT_RAISE: { inclusion_type: 'AVAILABLE' },
        TENANT_CHK: { inclusion_type: 'AVAILABLE' }
      },
      PRO: {
        OBJ_UNLIM: { inclusion_type: 'INCLUDED', quantity_limit: -1 },
        TENANT_BASE: { inclusion_type: 'INCLUDED' },
        LEASE_MGMT: { inclusion_type: 'INCLUDED' },
        DEPOSIT: { inclusion_type: 'INCLUDED' },
        RENT_RAISE: { inclusion_type: 'INCLUDED' },
        METER_MGMT: { inclusion_type: 'INCLUDED' },
        INCOME_EXP: { inclusion_type: 'INCLUDED' },
        BANK_CSV: { inclusion_type: 'INCLUDED' },
        BANK_API: { inclusion_type: 'INCLUDED' },
        AI_BOOKING: { inclusion_type: 'INCLUDED' },
        ANLAGE_V: { inclusion_type: 'INCLUDED' },
        TENANT_CHK: { inclusion_type: 'INCLUDED' }
      }
    };

    const tierFeaturesToCreate = [];
    for (const tier of createdTiers) {
      const config = featureConfigs[tier.tier_code];
      let sortOrder = 0;
      for (const [featureCode, settings] of Object.entries(config)) {
        const feature = features.find(f => f.feature_code === featureCode);
        if (feature) {
          tierFeaturesToCreate.push({
            tier_id: tier.id,
            feature_id: feature.id,
            inclusion_type: settings.inclusion_type,
            quantity_limit: settings.quantity_limit || null,
            is_highlighted: false,
            sort_order: sortOrder++
          });
        }
      }
    }

    await base44.asServiceRole.entities.TierFeature.bulkCreate(tierFeaturesToCreate);

    return Response.json({ 
      success: true,
      tiers: createdTiers.length,
      tier_limits: tierLimitsToCreate.length,
      tier_features: tierFeaturesToCreate.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
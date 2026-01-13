import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all pricing data
    const [products, tiers, features, featureGroups, tierFeatures, discounts, bundles, upsellTriggers] = await Promise.all([
      base44.asServiceRole.entities.Product.list(),
      base44.asServiceRole.entities.PricingTier.list(),
      base44.asServiceRole.entities.Feature.list(),
      base44.asServiceRole.entities.FeatureGroup.list(),
      base44.asServiceRole.entities.TierFeature.list(),
      base44.asServiceRole.entities.Discount.list(),
      base44.asServiceRole.entities.Bundle.list(),
      base44.asServiceRole.entities.UpsellTrigger.list()
    ]);

    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      data: {
        products: products.map(p => p.data),
        tiers: tiers.map(t => t.data),
        features: features.map(f => f.data),
        featureGroups: featureGroups.map(g => g.data),
        tierFeatures: tierFeatures.map(tf => tf.data),
        discounts: discounts.map(d => d.data),
        bundles: bundles.map(b => b.data),
        upsellTriggers: upsellTriggers.map(u => u.data)
      }
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
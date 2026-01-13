import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  try {
    const { 
      snapshot_name,
      description,
      is_baseline = false,
      version
    } = await req.json();
    
    if (!snapshot_name) {
      return Response.json({ error: 'snapshot_name is required' }, { status: 400 });
    }
    
    console.log(`Creating snapshot: ${snapshot_name}`);
    
    // Alle Pricing-Daten laden
    const [
      products,
      featureGroups,
      features,
      productFeatures,
      tiers,
      tierFeatures,
      tierLimits,
      usageLimits,
      bundles,
      bundleItems,
      discounts,
      triggers
    ] = await Promise.all([
      base44.asServiceRole.entities.Product.list(),
      base44.asServiceRole.entities.FeatureGroup.list(),
      base44.asServiceRole.entities.Feature.list(),
      base44.asServiceRole.entities.ProductFeature.list(),
      base44.asServiceRole.entities.PricingTier.list(),
      base44.asServiceRole.entities.TierFeature.list(),
      base44.asServiceRole.entities.TierLimit.list(),
      base44.asServiceRole.entities.UsageLimit.list(),
      base44.asServiceRole.entities.Bundle.list(),
      base44.asServiceRole.entities.BundleItem.list(),
      base44.asServiceRole.entities.Discount.list(),
      base44.asServiceRole.entities.UpsellTrigger.list()
    ]);
    
    const snapshotData = {
      timestamp: new Date().toISOString(),
      version: version || '1.0.0',
      products: products.map(p => p.data),
      feature_groups: featureGroups.map(g => g.data),
      features: features.map(f => f.data),
      product_features: productFeatures.map(pf => pf.data),
      tiers: tiers.map(t => t.data),
      tier_features: tierFeatures.map(tf => tf.data),
      tier_limits: tierLimits.map(tl => tl.data),
      usage_limits: usageLimits.map(ul => ul.data),
      bundles: bundles.map(b => b.data),
      bundle_items: bundleItems.map(bi => bi.data),
      discounts: discounts.map(d => d.data),
      upsell_triggers: triggers.map(t => t.data)
    };
    
    // Snapshot speichern
    const snapshot = await base44.asServiceRole.entities.PricingSnapshot.create({
      snapshot_name,
      description,
      snapshot_data: JSON.stringify(snapshotData),
      is_baseline,
      version: version || '1.0.0',
      metadata: JSON.stringify({
        total_entities: Object.values(snapshotData).reduce((sum, arr) => sum + arr.length, 0)
      })
    });
    
    console.log(`Snapshot created: ${snapshot.id}`);
    
    return Response.json({ 
      success: true, 
      snapshot_id: snapshot.id,
      entities_captured: Object.keys(snapshotData).reduce((obj, key) => {
        obj[key] = snapshotData[key].length;
        return obj;
      }, {})
    });
    
  } catch (error) {
    console.error('Snapshot creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  try {
    const { 
      include_products = true,
      include_features = true,
      include_tiers = true,
      include_bundles = true,
      include_discounts = true,
      include_triggers = true,
      only_active = false,
      format = 'json'
    } = await req.json();
    
    const exportData = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      version: '1.0.0',
      data: {}
    };
    
    // Products exportieren
    if (include_products) {
      let products = await base44.asServiceRole.entities.Product.list();
      if (only_active) {
        products = products.filter(p => p.data.is_active);
      }
      exportData.data.products = products.map(p => p.data);
      
      // FeatureGroups
      const groups = await base44.asServiceRole.entities.FeatureGroup.list();
      exportData.data.feature_groups = groups.map(g => g.data);
      
      // ProductFeatures
      const productFeatures = await base44.asServiceRole.entities.ProductFeature.list();
      exportData.data.product_features = productFeatures.map(pf => pf.data);
    }
    
    // Features exportieren
    if (include_features) {
      let features = await base44.asServiceRole.entities.Feature.list();
      if (only_active) {
        features = features.filter(f => f.data.is_active);
      }
      exportData.data.features = features.map(f => f.data);
    }
    
    // Tiers exportieren
    if (include_tiers) {
      let tiers = await base44.asServiceRole.entities.PricingTier.list();
      if (only_active) {
        tiers = tiers.filter(t => t.data.is_active);
      }
      exportData.data.tiers = tiers.map(t => t.data);
      
      // TierFeatures
      const tierFeatures = await base44.asServiceRole.entities.TierFeature.list();
      exportData.data.tier_features = tierFeatures.map(tf => tf.data);
      
      // TierLimits
      const tierLimits = await base44.asServiceRole.entities.TierLimit.list();
      exportData.data.tier_limits = tierLimits.map(tl => tl.data);
      
      // UsageLimits
      const usageLimits = await base44.asServiceRole.entities.UsageLimit.list();
      exportData.data.usage_limits = usageLimits.map(ul => ul.data);
    }
    
    // Bundles exportieren
    if (include_bundles) {
      let bundles = await base44.asServiceRole.entities.Bundle.list();
      if (only_active) {
        bundles = bundles.filter(b => b.data.is_active);
      }
      exportData.data.bundles = bundles.map(b => b.data);
      
      const bundleItems = await base44.asServiceRole.entities.BundleItem.list();
      exportData.data.bundle_items = bundleItems.map(bi => bi.data);
    }
    
    // Discounts exportieren
    if (include_discounts) {
      let discounts = await base44.asServiceRole.entities.Discount.list();
      if (only_active) {
        discounts = discounts.filter(d => d.data.is_active);
      }
      exportData.data.discounts = discounts.map(d => d.data);
    }
    
    // Triggers exportieren
    if (include_triggers) {
      let triggers = await base44.asServiceRole.entities.UpsellTrigger.list();
      if (only_active) {
        triggers = triggers.filter(t => t.data.is_active);
      }
      exportData.data.upsell_triggers = triggers.map(t => t.data);
    }
    
    console.log(`Configuration exported by ${user.email}`);
    
    if (format === 'csv') {
      // TODO: CSV-Konvertierung
      return Response.json({ error: 'CSV export not yet implemented' }, { status: 501 });
    }
    
    return Response.json(exportData);
    
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      featureGroups: 0,
      products: 0,
      features: 0,
      productFeatures: 0
    };

    // 1. FeatureGroups
    const featureGroups = [
      { group_code: "OBJEKT", name: "Objekt-Management", icon: "Building2", sort_order: 1 },
      { group_code: "MIETER", name: "Mieter & Verträge", icon: "Users", sort_order: 2 },
      { group_code: "FINANZEN", name: "Finanzen & Buchhaltung", icon: "Wallet", sort_order: 3 },
      { group_code: "ABRECHNUNG", name: "Betriebskosten & Abrechnung", icon: "Receipt", sort_order: 4 },
      { group_code: "STEUER", name: "Steuern & Export", icon: "FileText", sort_order: 5 },
      { group_code: "DOKUMENTE", name: "Dokumente & Kommunikation", icon: "Files", sort_order: 6 },
      { group_code: "ANALYSE", name: "Analyse & Reporting", icon: "BarChart3", sort_order: 7 },
      { group_code: "MARKTPLATZ", name: "Marktplatz & Vermittlung", icon: "Store", sort_order: 8 },
      { group_code: "SPEZIAL", name: "Spezial-Features", icon: "Sparkles", sort_order: 9 },
      { group_code: "TEAM", name: "Team-Features", icon: "UsersRound", sort_order: 10 },
      { group_code: "MIETER_APP", name: "Mieter-App Features", icon: "Smartphone", sort_order: 11 }
    ];

    const createdGroups = [];
    for (const group of featureGroups) {
      const existing = await base44.asServiceRole.entities.FeatureGroup.filter({ group_code: group.group_code });
      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.FeatureGroup.create(group);
        createdGroups.push(created);
        results.featureGroups++;
      } else {
        createdGroups.push(existing[0]);
      }
    }

    const groupMap = {};
    createdGroups.forEach(g => {
      groupMap[g.data.group_code] = g.id;
    });

    // 2. Products
    const products = [
      { 
        product_code: "VERMIETER_PRO", 
        name: "Vermieter Pro", 
        category: "CORE",
        description: "Die vollintegrierte Vermieterverwaltung für den deutschen Markt",
        target_audience: '["PRIVATVERMIETER", "SEMI_PROFI", "PROFI", "HAUSVERWALTUNG"]',
        icon: "Building2",
        color: "#10B981",
        is_active: true,
        sort_order: 1
      },
      { 
        product_code: "MIETER_APP", 
        name: "Mieter-App", 
        category: "FREEMIUM",
        description: "Kostenlose App für Mieter mit Premium-Funktionen",
        target_audience: '["MIETER"]',
        icon: "Smartphone",
        color: "#3B82F6",
        is_active: true,
        sort_order: 2
      },
      { 
        product_code: "STEUERBERATER_CONNECT", 
        name: "Steuerberater-Connect", 
        category: "STANDALONE",
        description: "Portal für Steuerberater zur Mandantenverwaltung",
        target_audience: '["STEUERBERATER"]',
        icon: "Calculator",
        color: "#8B5CF6",
        is_active: false,
        is_coming_soon: true,
        sort_order: 3
      }
    ];

    const createdProducts = [];
    for (const product of products) {
      const existing = await base44.asServiceRole.entities.Product.filter({ product_code: product.product_code });
      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.Product.create(product);
        createdProducts.push(created);
        results.products++;
      } else {
        createdProducts.push(existing[0]);
      }
    }

    const productMap = {};
    createdProducts.forEach(p => {
      productMap[p.data.product_code] = p.id;
    });

    // 3. Features
    const features = [
      { feature_code: "OBJ_1", name: "1 Objekt verwalten", group_id: groupMap["OBJEKT"], is_quantifiable: true, quantity_unit: "Objekte", price_type: "FREE", is_active: true, sort_order: 1, technical_key: "objects_limit_1" },
      { feature_code: "OBJ_3", name: "3 Objekte verwalten", group_id: groupMap["OBJEKT"], is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 490, price_type: "MONTHLY", is_active: true, sort_order: 2, technical_key: "objects_limit_3" },
      { feature_code: "OBJ_10", name: "10 Objekte verwalten", group_id: groupMap["OBJEKT"], is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 990, price_type: "MONTHLY", is_active: true, sort_order: 3, technical_key: "objects_limit_10" },
      { feature_code: "OBJ_UNLIM", name: "Unbegrenzt Objekte", group_id: groupMap["OBJEKT"], is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 1990, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "objects_unlimited" },
      { feature_code: "METER_MGMT", name: "Zähler-Verwaltung", group_id: groupMap["OBJEKT"], standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 5, technical_key: "meter_management" },
      { feature_code: "TENANT_BASE", name: "Mieter-Stammdaten", group_id: groupMap["MIETER"], price_type: "FREE", is_active: true, sort_order: 1, technical_key: "tenant_base" },
      { feature_code: "LEASE_MGMT", name: "Mietverträge", group_id: groupMap["MIETER"], price_type: "FREE", is_active: true, sort_order: 2, technical_key: "lease_management" },
      { feature_code: "DEPOSIT", name: "Kaution-Verwaltung", group_id: groupMap["MIETER"], standalone_price: 190, price_type: "MONTHLY", is_active: true, sort_order: 3, technical_key: "deposit_management" },
      { feature_code: "RENT_RAISE", name: "Mieterhöhungen (§558)", group_id: groupMap["MIETER"], standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "rent_increase" },
      { feature_code: "TENANT_CHK", name: "Mieter-Check (SCHUFA)", group_id: groupMap["MIETER"], standalone_price: 990, price_type: "PER_USE", is_active: true, sort_order: 5, technical_key: "tenant_check" },
      { feature_code: "INCOME_EXP", name: "Einnahmen/Ausgaben", group_id: groupMap["FINANZEN"], price_type: "FREE", is_active: true, sort_order: 1, technical_key: "income_expenses" },
      { feature_code: "BANK_CSV", name: "Bank-CSV-Import", group_id: groupMap["FINANZEN"], standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 2, technical_key: "bank_csv_import" },
      { feature_code: "BANK_API", name: "Bank-API (finAPI)", group_id: groupMap["FINANZEN"], standalone_price: 490, price_type: "MONTHLY", requires_features: '["BANK_CSV"]', is_active: true, sort_order: 3, technical_key: "bank_api" },
      { feature_code: "AI_BOOKING", name: "KI-Buchhalter", group_id: groupMap["FINANZEN"], standalone_price: 990, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "ai_booking" },
      { feature_code: "ANLAGE_V", name: "Anlage V Generator", group_id: groupMap["STEUER"], standalone_price: 490, price_type: "MONTHLY", is_active: true, sort_order: 1, technical_key: "tax_anlage_v" }
    ];

    const createdFeatures = [];
    for (const feature of features) {
      const existing = await base44.asServiceRole.entities.Feature.filter({ feature_code: feature.feature_code });
      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.Feature.create(feature);
        createdFeatures.push(created);
        results.features++;
      } else {
        createdFeatures.push(existing[0]);
      }
    }

    const featureMap = {};
    createdFeatures.forEach(f => {
      featureMap[f.data.feature_code] = f.id;
    });

    // 4. ProductFeatures für Vermieter Pro (alle Features)
    const productFeatures = [];
    if (productMap["VERMIETER_PRO"]) {
      const vermieterFeatures = [
        { feature_code: "OBJ_1", is_core: true, order: 1 },
        { feature_code: "OBJ_3", is_core: false, order: 2 },
        { feature_code: "OBJ_10", is_core: false, order: 3 },
        { feature_code: "OBJ_UNLIM", is_core: false, order: 4 },
        { feature_code: "METER_MGMT", is_core: false, order: 5 },
        { feature_code: "TENANT_BASE", is_core: true, order: 6 },
        { feature_code: "LEASE_MGMT", is_core: true, order: 7 },
        { feature_code: "DEPOSIT", is_core: false, order: 8 },
        { feature_code: "RENT_RAISE", is_core: false, order: 9 },
        { feature_code: "TENANT_CHK", is_core: false, order: 10 },
        { feature_code: "INCOME_EXP", is_core: true, order: 11 },
        { feature_code: "BANK_CSV", is_core: false, order: 12 },
        { feature_code: "BANK_API", is_core: false, order: 13 },
        { feature_code: "AI_BOOKING", is_core: false, order: 14 },
        { feature_code: "ANLAGE_V", is_core: false, order: 15 }
      ];

      for (const vf of vermieterFeatures) {
        if (featureMap[vf.feature_code]) {
          productFeatures.push({
            product_id: productMap["VERMIETER_PRO"],
            feature_id: featureMap[vf.feature_code],
            is_core_feature: vf.is_core,
            sort_order: vf.order
          });
        }
      }
    }

    // 5. ProductFeatures für Mieter-App (nur Basis-Features)
    if (productMap["MIETER_APP"]) {
      productFeatures.push(
        {
          product_id: productMap["MIETER_APP"],
          feature_id: featureMap["TENANT_BASE"],
          is_core_feature: true,
          sort_order: 1
        },
        {
          product_id: productMap["MIETER_APP"],
          feature_id: featureMap["LEASE_MGMT"],
          is_core_feature: true,
          sort_order: 2
        }
      );
    }

    // Bulk-Create ProductFeatures
    for (const pf of productFeatures) {
      const existing = await base44.asServiceRole.entities.ProductFeature.filter({ 
        product_id: pf.product_id, 
        feature_id: pf.feature_id 
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.ProductFeature.create(pf);
        results.productFeatures++;
      }
    }

    return Response.json({
      success: true,
      message: "Pricing-Daten erfolgreich geseedet",
      results
    });

  } catch (error) {
    console.error('Seed Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
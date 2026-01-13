import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Feature Groups
    const groups = [
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

    const createdGroups = await base44.asServiceRole.entities.FeatureGroup.bulkCreate(groups);
    const groupMap = {};
    createdGroups.forEach((g, i) => {
      groupMap[groups[i].group_code] = g.id;
    });

    // Products
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

    const createdProducts = await base44.asServiceRole.entities.Product.bulkCreate(products);

    // Features
    const features = [
      // OBJEKT-MANAGEMENT
      { feature_code: "OBJ_1", name: "1 Objekt verwalten", group_id: groupMap.OBJEKT, is_quantifiable: true, quantity_unit: "Objekte", price_type: "FREE", is_active: true, sort_order: 1, technical_key: "objects_limit_1" },
      { feature_code: "OBJ_3", name: "3 Objekte verwalten", group_id: groupMap.OBJEKT, is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 490, price_type: "MONTHLY", is_active: true, sort_order: 2, technical_key: "objects_limit_3" },
      { feature_code: "OBJ_10", name: "10 Objekte verwalten", group_id: groupMap.OBJEKT, is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 990, price_type: "MONTHLY", is_active: true, sort_order: 3, technical_key: "objects_limit_10" },
      { feature_code: "OBJ_UNLIM", name: "Unbegrenzt Objekte", group_id: groupMap.OBJEKT, is_quantifiable: true, quantity_unit: "Objekte", standalone_price: 1990, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "objects_unlimited" },
      { feature_code: "METER_MGMT", name: "Zähler-Verwaltung", group_id: groupMap.OBJEKT, standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 5, technical_key: "meter_management" },
      
      // MIETER & VERTRÄGE
      { feature_code: "TENANT_BASE", name: "Mieter-Stammdaten", group_id: groupMap.MIETER, price_type: "FREE", is_active: true, sort_order: 1, technical_key: "tenant_base" },
      { feature_code: "LEASE_MGMT", name: "Mietverträge", group_id: groupMap.MIETER, price_type: "FREE", is_active: true, sort_order: 2, technical_key: "lease_management" },
      { feature_code: "DEPOSIT", name: "Kaution-Verwaltung", group_id: groupMap.MIETER, standalone_price: 190, price_type: "MONTHLY", is_active: true, sort_order: 3, technical_key: "deposit_management" },
      { feature_code: "RENT_RAISE", name: "Mieterhöhungen (§558)", group_id: groupMap.MIETER, standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "rent_increase" },
      { feature_code: "TENANT_CHK", name: "Mieter-Check (SCHUFA)", group_id: groupMap.MIETER, standalone_price: 990, price_type: "PER_USE", is_active: true, sort_order: 5, technical_key: "tenant_check" },
      
      // FINANZEN
      { feature_code: "INCOME_EXP", name: "Einnahmen/Ausgaben", group_id: groupMap.FINANZEN, price_type: "FREE", is_active: true, sort_order: 1, technical_key: "income_expenses" },
      { feature_code: "BANK_CSV", name: "Bank-CSV-Import", group_id: groupMap.FINANZEN, standalone_price: 290, price_type: "MONTHLY", is_active: true, sort_order: 2, technical_key: "bank_csv_import" },
      { feature_code: "BANK_API", name: "Bank-API (finAPI)", group_id: groupMap.FINANZEN, standalone_price: 490, price_type: "MONTHLY", requires_features: '["BANK_CSV"]', is_active: true, sort_order: 3, technical_key: "bank_api" },
      { feature_code: "AI_BOOKING", name: "KI-Buchhalter", group_id: groupMap.FINANZEN, standalone_price: 990, price_type: "MONTHLY", is_active: true, sort_order: 4, technical_key: "ai_booking" },
      
      // STEUERN
      { feature_code: "ANLAGE_V", name: "Anlage V Generator", group_id: groupMap.STEUER, standalone_price: 490, price_type: "MONTHLY", is_active: true, sort_order: 1, technical_key: "tax_anlage_v" }
    ];

    await base44.asServiceRole.entities.Feature.bulkCreate(features);

    return Response.json({ 
      success: true,
      groups: createdGroups.length,
      products: createdProducts.length,
      features: features.length
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
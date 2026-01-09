import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const results = {
      categories_created: 0,
      configs_created: 0,
      rules_created: 0,
      errors: []
    };
    
    // Create categories
    const categories = [
      { category_code: 'ANLAGE_V', display_name: 'Anlage V - Vermietung & Verpachtung', tax_type: 'ANLAGE_V', sort_order: 1 },
      { category_code: 'ANLAGE_KAP', display_name: 'Anlage KAP - Kapitalerträge', tax_type: 'ANLAGE_KAP', sort_order: 2 },
      { category_code: 'EUER', display_name: 'EÜR - Einnahmen-Überschuss-Rechnung', tax_type: 'EUER', sort_order: 3 },
      { category_code: 'EST_ALLGEMEIN', display_name: 'Einkommensteuer - Allgemein', tax_type: 'EST', sort_order: 4 },
      { category_code: 'GEWST', display_name: 'Gewerbesteuer', tax_type: 'GEWST', sort_order: 5 },
      { category_code: 'UST', display_name: 'Umsatzsteuer', tax_type: 'UST', sort_order: 6 },
      { category_code: 'GREST', display_name: 'Grunderwerbsteuer', tax_type: 'GREST', sort_order: 7 },
      { category_code: 'BETRIEBSKOSTEN', display_name: 'Betriebskosten nach BetrKV', tax_type: 'ALLGEMEIN', sort_order: 10 }
    ];
    
    const categoryMap = {};
    for (const cat of categories) {
      try {
        const existing = (await base44.entities.TaxRuleCategory.filter({ 
          category_code: cat.category_code 
        }))[0];
        
        if (!existing) {
          const created = await base44.entities.TaxRuleCategory.create({
            ...cat,
            is_active: true
          });
          categoryMap[cat.category_code] = created.id;
          results.categories_created++;
        } else {
          categoryMap[cat.category_code] = existing.id;
        }
      } catch (e) {
        results.errors.push(`Category ${cat.category_code}: ${e.message}`);
      }
    }
    
    // Create configs
    const configs = [
      { config_key: 'AFA_RATE_WOHNGEBAEUDE_2023', category: 'ANLAGE_V', display_name: 'AfA-Satz Wohngebäude (ab 2023)',
        value_type: 'PERCENTAGE', value: '3', unit: '%', valid_from_tax_year: 2023, legal_reference: '§7 Abs. 4 EStG' },
      { config_key: 'AFA_NUTZUNGSDAUER_WOHNGEBAEUDE_2023', category: 'ANLAGE_V', display_name: 'Nutzungsdauer Wohngebäude (ab 2023)',
        value_type: 'INTEGER', value: '33', unit: 'Jahre', valid_from_tax_year: 2023, legal_reference: '§7 Abs. 4 EStG' },
      { config_key: 'GWG_GRENZE', category: 'EST_ALLGEMEIN', display_name: 'GWG-Grenze',
        value_type: 'CURRENCY', value: '800', unit: '€', valid_from_tax_year: 2018, legal_reference: '§6 Abs. 2 EStG' },
      { config_key: 'SPARER_PAUSCHBETRAG', category: 'ANLAGE_KAP', display_name: 'Sparer-Pauschbetrag',
        value_type: 'CURRENCY', value: '1000', unit: '€', valid_from_tax_year: 2023, legal_reference: '§20 Abs. 9 EStG' },
      { config_key: 'UST_REGELSATZ', category: 'UST', display_name: 'Umsatzsteuer Regelsatz',
        value_type: 'PERCENTAGE', value: '19', unit: '%', valid_from_tax_year: 2007, legal_reference: '§12 Abs. 1 UStG' },
      { config_key: 'KLEINUNTERNEHMER_GRENZE', category: 'UST', display_name: 'Kleinunternehmergrenze',
        value_type: 'CURRENCY', value: '22000', unit: '€', valid_from_tax_year: 2020, legal_reference: '§19 Abs. 1 UStG' }
    ];
    
    for (const config of configs) {
      try {
        const existing = (await base44.entities.TaxConfig.filter({
          config_key: config.config_key,
          valid_from_tax_year: config.valid_from_tax_year
        }))[0];
        
        if (!existing) {
          await base44.entities.TaxConfig.create({
            ...config,
            category_id: categoryMap[config.category],
            source: 'MIGRATION',
            approved_by: user.email,
            approved_at: new Date().toISOString(),
            is_active: true
          });
          results.configs_created++;
        }
      } catch (e) {
        results.errors.push(`Config ${config.config_key}: ${e.message}`);
      }
    }
    
    // Audit log
    await base44.entities.TaxRuleAuditLog.create({
      entity_type: 'TaxConfig',
      entity_id: 'MIGRATION',
      action: 'CREATE',
      new_values: results,
      change_reason: 'Initiale Migration hardcodierter Steuerregeln',
      performed_by: user.email,
      performed_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error migrating legacy tax rules:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Beispiel-Funktion zeigt Integration der neuen TaxRule-Engine
 * in bestehende AfA-Berechnungen
 * 
 * Diese Funktion würde in existierende AfA-Berechnungen integriert
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { 
      building_id,
      tax_year,
      building_type,
      baujahr,
      fertigstellung_datum,
      nutzung,
      gebaeudewert
    } = await req.json();
    
    // Neue Methode: Verwende dynamische TaxRule-Engine statt hardcoded Werte
    const ruleResult = await base44.functions.invoke('evaluateTaxRule', {
      category_code: 'ANLAGE_V',
      rule_codes: ['AFA_WOHNGEBAEUDE_BAUJAHR'],
      tax_year: tax_year,
      context: {
        gebaeude_typ: building_type,
        baujahr: baujahr,
        fertigstellung_datum: fertigstellung_datum,
        nutzung: nutzung,
        gebaeudewert: gebaeudewert
      }
    });
    
    // Extrahiere Ergebnisse
    const afaResult = ruleResult.data.results[0]?.result || {};
    const afa_rate = afaResult.afa_rate || 0.02;
    const jaehrliche_afa = afaResult.jaehrliche_afa || (gebaeudewert * afa_rate);
    
    // Warnings aus Rule-Auswertung prüfen
    const warnings = ruleResult.data.errors || [];
    
    return Response.json({
      success: true,
      building_id,
      tax_year,
      afa_rate,
      afa_rate_percent: (afa_rate * 100).toFixed(2),
      jaehrliche_afa: parseFloat(jaehrliche_afa.toFixed(2)),
      applied_rules: ruleResult.data.applied_rules,
      warnings,
      config_values: ruleResult.data.config_values
    });
    
  } catch (error) {
    console.error('Error calculating AfA:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
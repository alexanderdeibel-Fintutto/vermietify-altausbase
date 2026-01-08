import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { base_submission_id, scenarios } = await req.json();

    if (!base_submission_id || !scenarios) {
      return Response.json({ 
        error: 'base_submission_id and scenarios required' 
      }, { status: 400 });
    }

    console.log(`[TAX-SCENARIO] Simulating ${scenarios.length} scenarios`);

    const baseSubmission = await base44.entities.ElsterSubmission.filter({ 
      id: base_submission_id 
    });
    
    if (baseSubmission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const base = baseSubmission[0];
    const baseData = base.form_data || {};
    
    const results = [];

    for (const scenario of scenarios) {
      const modifiedData = { ...baseData };
      
      // Wende Szenario-Änderungen an
      Object.entries(scenario.changes || {}).forEach(([field, value]) => {
        modifiedData[field] = value;
      });

      // Berechne Auswirkungen
      const einnahmen = parseFloat(modifiedData.einnahmen_gesamt || 0);
      const werbungskosten = parseFloat(modifiedData.werbungskosten_gesamt || 0);
      const afa = parseFloat(modifiedData.afa_betrag || 0);
      
      const einkuenfte = einnahmen - werbungskosten - afa;
      const steuerlicheAuswirkung = einkuenfte * 0.42; // Vereinfachte Berechnung (42% Grenzsteuersatz)

      // Vergleich mit Basis
      const baseEinkuenfte = 
        parseFloat(baseData.einnahmen_gesamt || 0) - 
        parseFloat(baseData.werbungskosten_gesamt || 0) - 
        parseFloat(baseData.afa_betrag || 0);
      
      const baseSteuerlast = baseEinkuenfte * 0.42;
      const differenz = steuerlicheAuswirkung - baseSteuerlast;

      results.push({
        scenario_name: scenario.name,
        changes: scenario.changes,
        calculated: {
          einnahmen,
          werbungskosten,
          afa,
          einkuenfte,
          geschaetzte_steuerlast: Math.round(steuerlicheAuswirkung)
        },
        comparison: {
          differenz_zur_basis: Math.round(differenz),
          prozentuale_aenderung: baseSteuerlast !== 0 
            ? Math.round((differenz / baseSteuerlast) * 100) 
            : 0
        }
      });
    }

    console.log(`[TAX-SCENARIO] Calculated ${results.length} scenarios`);

    return Response.json({
      success: true,
      base_scenario: {
        einnahmen: parseFloat(baseData.einnahmen_gesamt || 0),
        werbungskosten: parseFloat(baseData.werbungskosten_gesamt || 0),
        afa: parseFloat(baseData.afa_betrag || 0)
      },
      scenarios: results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
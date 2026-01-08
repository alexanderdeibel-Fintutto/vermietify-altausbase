import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];
    const validationResults = {
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Prüfe Pflichtfelder
    if (!sub.form_data) {
      validationResults.errors.push('Formulardaten fehlen');
      validationResults.passed = false;
    } else {
      const formData = sub.form_data;

      // Anlage V spezifisch
      if (sub.tax_form_type === 'ANLAGE_V') {
        if (!formData.einnahmen_gesamt || formData.einnahmen_gesamt <= 0) {
          validationResults.errors.push('Einnahmen müssen > 0 sein');
          validationResults.passed = false;
        }

        if (formData.werbungskosten_gesamt && formData.werbungskosten_gesamt > formData.einnahmen_gesamt * 1.5) {
          validationResults.warnings.push('Werbungskosten ungewöhnlich hoch (>150% der Einnahmen)');
        }

        if (!formData.afa_betrag || formData.afa_betrag === 0) {
          validationResults.suggestions.push('Keine AfA angegeben - prüfen Sie ob berechtigt');
        }
      }

      // Allgemeine Prüfungen
      if (formData.finanzamt && !formData.steuernummer) {
        validationResults.errors.push('Steuernummer fehlt');
        validationResults.passed = false;
      }
    }

    // Cross-Validation mit historischen Daten
    const historicalSubs = await base44.entities.ElsterSubmission.filter({
      building_id: sub.building_id,
      tax_form_type: sub.tax_form_type,
      status: 'ACCEPTED'
    });

    if (historicalSubs.length > 0) {
      const avgEinnahmen = historicalSubs.reduce((sum, s) => sum + (s.form_data?.einnahmen_gesamt || 0), 0) / historicalSubs.length;
      
      if (sub.form_data?.einnahmen_gesamt && Math.abs(sub.form_data.einnahmen_gesamt - avgEinnahmen) > avgEinnahmen * 0.5) {
        validationResults.warnings.push(`Einnahmen weichen stark vom Durchschnitt ab (Ø €${avgEinnahmen.toFixed(2)})`);
      }
    }

    return Response.json({ success: true, validation: validationResults });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
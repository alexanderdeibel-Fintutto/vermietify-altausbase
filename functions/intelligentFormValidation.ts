import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[VALIDATE] Intelligent validation for ${submission_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];
    const errors = [];
    const warnings = [];
    const suggestions = [];
    const data = submission.form_data || {};

    // Grundlegende Pflichtfeld-Validierung
    const requiredFields = ['income_rent', 'expense_property_tax'];
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === 0) {
        errors.push({
          field,
          code: 'REQUIRED_FIELD',
          message: `Pflichtfeld "${field}" fehlt oder ist 0`,
          severity: 'error'
        });
      }
    });

    // Plausibilitätsprüfungen
    if (data.income_rent && data.income_rent < 0) {
      errors.push({
        field: 'income_rent',
        code: 'NEGATIVE_INCOME',
        message: 'Mieteinnahmen können nicht negativ sein',
        severity: 'error'
      });
    }

    // Werbungskosten höher als Einnahmen
    const totalExpenses = (data.expense_property_tax || 0) + 
                          (data.expense_insurance || 0) + 
                          (data.expense_maintenance || 0) + 
                          (data.expense_administration || 0) +
                          (data.afa_amount || 0);

    if (totalExpenses > (data.income_rent || 0) * 2) {
      warnings.push({
        field: 'expenses',
        code: 'HIGH_EXPENSES',
        message: `Werbungskosten (${totalExpenses.toFixed(2)}€) sind mehr als doppelt so hoch wie Einnahmen`,
        severity: 'warning'
      });
    }

    // AfA-Plausibilität
    if (data.building_cost && data.afa_amount) {
      const expectedAfa = data.building_cost * 0.02; // 2% linear
      const deviation = Math.abs(data.afa_amount - expectedAfa) / expectedAfa;
      
      if (deviation > 0.1) {
        warnings.push({
          field: 'afa_amount',
          code: 'AFA_DEVIATION',
          message: `AfA-Betrag weicht um ${(deviation * 100).toFixed(1)}% vom erwarteten Wert ab (erwartet: ${expectedAfa.toFixed(2)}€)`,
          severity: 'warning',
          suggestion: `Prüfen Sie, ob der AfA-Satz korrekt ist (üblicherweise 2% für Wohngebäude)`
        });
      }
    }

    // Vergleich mit historischen Daten
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id: submission.building_id,
      tax_form_type: submission.tax_form_type,
      status: 'ACCEPTED'
    });

    if (historicalSubmissions.length > 0) {
      const lastYear = historicalSubmissions.sort((a, b) => b.tax_year - a.tax_year)[0];
      
      if (lastYear.form_data?.income_rent) {
        const rentChange = ((data.income_rent - lastYear.form_data.income_rent) / lastYear.form_data.income_rent) * 100;
        
        if (Math.abs(rentChange) > 20) {
          warnings.push({
            field: 'income_rent',
            code: 'RENT_CHANGE',
            message: `Mieteinnahmen haben sich um ${rentChange.toFixed(1)}% geändert (Vorjahr: ${lastYear.form_data.income_rent.toFixed(2)}€)`,
            severity: 'info',
            suggestion: 'Bei größeren Änderungen sollte eine Begründung vorliegen'
          });
        }
      }
    }

    // Fehlende Optimierungen
    if (!data.expense_maintenance || data.expense_maintenance === 0) {
      suggestions.push({
        field: 'expense_maintenance',
        message: 'Keine Instandhaltungskosten angegeben',
        benefit: 'Instandhaltungskosten sind sofort absetzbar und reduzieren Ihre Steuerlast',
        action: 'Prüfen Sie, ob im Jahr Reparaturen durchgeführt wurden'
      });
    }

    if (!data.expense_administration || data.expense_administration < 100) {
      suggestions.push({
        field: 'expense_administration',
        message: 'Verwaltungskosten scheinen niedrig',
        benefit: 'Kontoführungsgebühren, Software, Steuerberatung können angesetzt werden',
        action: 'Überprüfen Sie alle administrativen Aufwendungen'
      });
    }

    // KI-Confidence Score
    let confidence = 100;
    confidence -= errors.length * 20;
    confidence -= warnings.length * 10;
    confidence = Math.max(0, Math.min(100, confidence));

    // Update Submission
    await base44.entities.ElsterSubmission.update(submission_id, {
      validation_errors: errors,
      validation_warnings: warnings,
      ai_confidence_score: confidence,
      status: errors.length === 0 ? 'VALIDATED' : submission.status
    });

    console.log(`[SUCCESS] Validation complete: ${errors.length} errors, ${warnings.length} warnings`);

    return Response.json({
      success: true,
      validation: {
        is_valid: errors.length === 0,
        confidence_score: confidence,
        errors,
        warnings,
        suggestions
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
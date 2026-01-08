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

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    console.log(`[VALIDATION REPORT] Generating for ${submission.id}`);

    const report = {
      submission_id: submission.id,
      tax_form_type: submission.tax_form_type,
      tax_year: submission.tax_year,
      generated_at: new Date().toISOString(),
      overall_status: 'pending',
      completeness: 0,
      accuracy: 0,
      compliance: 0,
      sections: []
    };

    // Validiere nach Form-Type
    const formData = submission.form_data || {};
    const requiredFields = getRequiredFields(submission.tax_form_type);
    
    // Completeness Check
    const filledFields = requiredFields.filter(field => 
      formData[field] !== undefined && formData[field] !== null && formData[field] !== ''
    );
    report.completeness = Math.round((filledFields.length / requiredFields.length) * 100);

    // Accuracy Check (basierend auf Plausibilitätsprüfung)
    const plausibilityResponse = await base44.functions.invoke('checkPlausibility', {
      submission_id
    });
    
    if (plausibilityResponse.data.success) {
      report.accuracy = plausibilityResponse.data.plausibility_score || 0;
    }

    // Compliance Check
    const complianceIssues = [];
    
    // Prüfe Pflichtfelder
    const missingFields = requiredFields.filter(field => 
      !formData[field] || formData[field] === ''
    );
    
    if (missingFields.length > 0) {
      complianceIssues.push({
        severity: 'error',
        category: 'Pflichtfelder',
        message: `${missingFields.length} Pflichtfelder fehlen`,
        fields: missingFields,
        fix: 'Bitte füllen Sie alle Pflichtfelder aus'
      });
    }

    // Prüfe Zahlenwerte
    const numericFields = Object.entries(formData).filter(([key, value]) => 
      typeof value === 'number'
    );
    
    numericFields.forEach(([key, value]) => {
      if (value < 0 && !key.includes('loss') && !key.includes('verlust')) {
        complianceIssues.push({
          severity: 'warning',
          category: 'Datenkonsistenz',
          message: `Negativer Wert bei ${key}: ${value}`,
          field: key,
          fix: 'Prüfen Sie, ob dieser Wert korrekt ist'
        });
      }
    });

    // Prüfe Summen
    if (formData.income_total && formData.expense_total) {
      const calculatedResult = formData.income_total - formData.expense_total;
      if (formData.net_result && Math.abs(calculatedResult - formData.net_result) > 0.01) {
        complianceIssues.push({
          severity: 'error',
          category: 'Berechnungsfehler',
          message: 'Netto-Ergebnis stimmt nicht mit Einnahmen/Ausgaben überein',
          fix: `Sollte ${calculatedResult.toFixed(2)} sein, ist aber ${formData.net_result}`
        });
      }
    }

    report.compliance = Math.max(0, 100 - (complianceIssues.filter(i => i.severity === 'error').length * 20));

    // Overall Status
    if (report.completeness === 100 && report.accuracy >= 90 && report.compliance === 100) {
      report.overall_status = 'excellent';
    } else if (report.completeness >= 80 && report.accuracy >= 70 && report.compliance >= 80) {
      report.overall_status = 'good';
    } else if (report.completeness >= 50 && report.accuracy >= 50 && report.compliance >= 50) {
      report.overall_status = 'acceptable';
    } else {
      report.overall_status = 'needs_work';
    }

    // Sections
    report.sections = [
      {
        name: 'Vollständigkeit',
        score: report.completeness,
        status: report.completeness === 100 ? 'pass' : 'fail',
        details: `${filledFields.length} von ${requiredFields.length} Pflichtfeldern ausgefüllt`,
        issues: missingFields.length > 0 ? [{
          message: `Fehlende Felder: ${missingFields.join(', ')}`,
          severity: 'error'
        }] : []
      },
      {
        name: 'Genauigkeit',
        score: report.accuracy,
        status: report.accuracy >= 70 ? 'pass' : 'fail',
        details: 'Basierend auf Plausibilitätsprüfung und Branchenvergleich',
        issues: plausibilityResponse.data.issues || []
      },
      {
        name: 'Compliance',
        score: report.compliance,
        status: report.compliance >= 80 ? 'pass' : 'fail',
        details: 'Einhaltung der ELSTER-Vorgaben',
        issues: complianceIssues
      }
    ];

    // Recommendations
    report.recommendations = [];
    
    if (report.completeness < 100) {
      report.recommendations.push({
        priority: 'high',
        title: 'Fehlende Pflichtfelder',
        description: `${missingFields.length} Felder müssen ausgefüllt werden`,
        action: 'Vervollständigen Sie das Formular'
      });
    }

    if (report.accuracy < 70) {
      report.recommendations.push({
        priority: 'high',
        title: 'Niedrige Genauigkeit',
        description: 'Daten weichen stark von Branchenwerten ab',
        action: 'Überprüfen Sie die eingegebenen Werte'
      });
    }

    if (complianceIssues.some(i => i.severity === 'error')) {
      report.recommendations.push({
        priority: 'high',
        title: 'Compliance-Fehler',
        description: 'Formular entspricht nicht den ELSTER-Vorgaben',
        action: 'Beheben Sie die aufgeführten Fehler'
      });
    }

    console.log(`[SUCCESS] Report generated with status: ${report.overall_status}`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getRequiredFields(formType) {
  const fieldsByType = {
    ANLAGE_V: [
      'income_rent', 'address', 'property_type', 'owner_name',
      'tax_number', 'rental_period_start', 'rental_period_end'
    ],
    EUER: [
      'business_income', 'business_expenses', 'business_name',
      'tax_number', 'tax_year'
    ],
    GEWERBESTEUER: [
      'business_name', 'revenue', 'tax_number', 'tax_year'
    ],
    UMSATZSTEUER: [
      'revenue', 'vat_collected', 'vat_paid', 'tax_number', 'tax_year'
    ]
  };

  return fieldsByType[formType] || [];
}
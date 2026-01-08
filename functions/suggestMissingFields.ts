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

    console.log(`[SUGGEST-FIELDS] Analyzing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const formData = sub.form_data || {};

    // Standard-Felder je nach Formulartyp
    const requiredFieldsByType = {
      ANLAGE_V: [
        'einnahmen_gesamt',
        'werbungskosten_gesamt',
        'afa_betrag',
        'schuldzinsen',
        'grundsteuer',
        'versicherungen',
        'erhaltungsaufwand'
      ],
      EUER: [
        'betriebseinnahmen',
        'betriebsausgaben',
        'gewinn',
        'entnahmen',
        'einlagen'
      ],
      UMSATZSTEUER: [
        'steuerpflichtige_umsaetze',
        'vorsteuer',
        'zahllast'
      ]
    };

    const expectedFields = requiredFieldsByType[sub.tax_form_type] || [];
    const missingFields = expectedFields.filter(field => !formData[field] || formData[field] === 0);

    const suggestions = [];

    for (const field of missingFields) {
      // Versuche Wert aus Building oder FinancialItems zu ermitteln
      let suggestedValue = null;
      let confidence = 0;

      if (sub.building_id) {
        const financialItems = await base44.entities.FinancialItem.filter({
          building_id: sub.building_id
        });

        const relevantItems = financialItems.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === sub.tax_year;
        });

        // Mapping von Feldern zu FinancialItem Kategorien
        const fieldMappings = {
          'grundsteuer': ['property_tax', 'grundsteuer'],
          'versicherungen': ['insurance', 'versicherung'],
          'schuldzinsen': ['interest', 'zinsen'],
          'erhaltungsaufwand': ['maintenance', 'reparatur', 'instandhaltung']
        };

        if (fieldMappings[field]) {
          const sum = relevantItems
            .filter(item => fieldMappings[field].some(cat => 
              item.category?.toLowerCase().includes(cat)
            ))
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

          if (sum > 0) {
            suggestedValue = sum;
            confidence = 80;
          }
        }
      }

      suggestions.push({
        field,
        current_value: formData[field] || null,
        suggested_value: suggestedValue,
        confidence,
        reason: suggestedValue 
          ? 'Aus Finanzdaten berechnet' 
          : 'Feld sollte ausgefüllt werden'
      });
    }

    console.log(`[SUGGEST-FIELDS] Found ${suggestions.length} suggestions`);

    return Response.json({
      success: true,
      suggestions,
      missing_count: missingFields.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
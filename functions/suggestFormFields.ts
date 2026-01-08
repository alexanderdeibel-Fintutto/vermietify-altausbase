import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_form_type, tax_year } = await req.json();

    console.log(`[SUGGEST] Fields for ${tax_form_type} ${tax_year}`);

    // Hole historische Submissions für dieses Gebäude
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type
    });

    if (historicalSubmissions.length === 0) {
      return Response.json({
        has_suggestions: false,
        message: 'Keine historischen Daten verfügbar'
      });
    }

    // Sortiere nach Jahr absteigend
    const sortedSubmissions = historicalSubmissions
      .filter(s => s.tax_year < tax_year && s.form_data)
      .sort((a, b) => b.tax_year - a.tax_year);

    if (sortedSubmissions.length === 0) {
      return Response.json({
        has_suggestions: false,
        message: 'Keine passenden historischen Daten'
      });
    }

    const mostRecent = sortedSubmissions[0];
    const suggestions = {};

    // Vorschläge basierend auf letztem Jahr
    if (mostRecent.form_data) {
      const unchangingFields = [
        'taxpayer_name',
        'taxpayer_address',
        'property_address',
        'tax_number',
        'bank_account'
      ];

      unchangingFields.forEach(field => {
        if (mostRecent.form_data[field]) {
          suggestions[field] = {
            value: mostRecent.form_data[field],
            confidence: 95,
            source: `Aus ${mostRecent.tax_year}`,
            type: 'exact'
          };
        }
      });

      // Geschätzte Werte mit Trend
      const numericalFields = [
        'income_rent',
        'expense_property_tax',
        'expense_insurance',
        'afa_amount'
      ];

      if (sortedSubmissions.length >= 2) {
        const secondRecent = sortedSubmissions[1];
        
        numericalFields.forEach(field => {
          const recent = mostRecent.form_data[field];
          const previous = secondRecent.form_data[field];

          if (recent && previous) {
            const change = recent - previous;
            const trend = (change / previous) * 100;
            const estimated = recent + (change * 0.5); // 50% des Trends

            suggestions[field] = {
              value: Math.round(estimated * 100) / 100,
              confidence: 70,
              source: `Geschätzt basierend auf Trend ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`,
              type: 'estimated',
              historical_values: {
                [mostRecent.tax_year]: recent,
                [secondRecent.tax_year]: previous
              }
            };
          }
        });
      }
    }

    return Response.json({
      has_suggestions: Object.keys(suggestions).length > 0,
      suggestions,
      based_on_year: mostRecent.tax_year,
      confidence_note: 'Bitte alle Vorschläge manuell prüfen'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
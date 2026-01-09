import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-powered tax forecast based on user financial data
 * Estimates tax liability for current and next year with warnings
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            year_to_date_income,
            projected_annual_income,
            year_to_date_expenses,
            projected_annual_expenses,
            country,
            tax_year,
            existing_savings
        } = await req.json();

        // Fetch user tax profile and rules for context
        const profiles = await base44.asServiceRole.entities.TaxProfile.filter(
            { user_email: user.email },
            '-updated_date',
            1
        );

        const taxRules = await base44.asServiceRole.entities.TaxRule.filter(
            { is_active: true, valid_from_tax_year: { $lte: tax_year } },
            'priority',
            15
        );

        const forecast = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein Steuerprognose-Experte. Erstelle eine detaillierte Steuerprognose.

BENUTZER-FINANZIELLE DATEN (${tax_year}):
- Einkommen YTD: ${year_to_date_income}
- Geschätztes Jahreseinkommen: ${projected_annual_income}
- Ausgaben YTD: ${year_to_date_expenses}
- Geschätzte Jahresausgaben: ${projected_annual_expenses}
- Land: ${country}
- Bisherige Ersparnisse: ${existing_savings}

VERFÜGBARE STEUERREGELN:
${taxRules.map(r => `• ${r.display_name}: ${r.description}`).join('\n')}

ANALYSIERE UND GEBE STRUKTURIERTE JSON ANTWORT:
{
  "estimated_tax_liability_2024": {
    "amount": 0,
    "currency": "EUR",
    "confidence": 0.85,
    "calculation_notes": "..."
  },
  "projected_tax_liability_2025": {
    "amount": 0,
    "currency": "EUR",
    "confidence": 0.75,
    "calculation_notes": "..."
  },
  "monthly_tax_obligation": {
    "amount": 0,
    "description": "durchschnittliche monatliche Zahlungsverpflichtung"
  },
  "tax_rate_analysis": {
    "effective_rate_2024": 0.25,
    "marginal_rate": 0.42,
    "comparison_notes": "..."
  },
  "warnings": [
    {
      "level": "high|medium|low",
      "title": "Warnung Titel",
      "description": "...",
      "impact": "..."
    }
  ],
  "optimization_suggestions": [
    {
      "title": "Optimierungsvorschlag",
      "description": "...",
      "potential_savings": 0,
      "implementation_difficulty": "low|medium|high",
      "timing": "immediate|quarterly|annual"
    }
  ],
  "quarterly_payment_schedule": [
    {
      "quarter": 1,
      "due_date": "2025-03-31",
      "estimated_payment": 0
    }
  ],
  "actions_required": [
    "Aktion 1",
    "Aktion 2"
  ]
}`,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    estimated_tax_liability_2024: { type: 'object' },
                    projected_tax_liability_2025: { type: 'object' },
                    monthly_tax_obligation: { type: 'object' },
                    tax_rate_analysis: { type: 'object' },
                    warnings: { type: 'array', items: { type: 'object' } },
                    optimization_suggestions: { type: 'array', items: { type: 'object' } },
                    quarterly_payment_schedule: { type: 'array', items: { type: 'object' } },
                    actions_required: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        // Save forecast to user profile for reference
        const profiles_list = await base44.asServiceRole.entities.TaxProfile.filter(
            { user_email: user.email },
            '-updated_date',
            1
        );

        if (profiles_list.length > 0) {
            await base44.asServiceRole.entities.TaxProfile.update(profiles_list[0].id, {
                estimated_annual_tax: forecast.estimated_tax_liability_2024.amount,
                last_assessment: new Date().toISOString()
            });
        }

        return Response.json({
            success: true,
            forecast,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating tax forecast:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate personalized tax planning advice based on user financial data and goals
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            annual_income, 
            income_sources, 
            assets, 
            liabilities,
            tax_goals,
            country,
            tax_year
        } = await req.json();

        // Fetch user's tax profile for context
        const userProfiles = await base44.asServiceRole.entities.TaxProfile.filter(
            { user_email: user.email },
            '-updated_date',
            1
        );

        const profile = userProfiles?.[0] || {};

        // Get relevant tax rules
        const taxRules = await base44.asServiceRole.entities.TaxRule.filter(
            { 
                is_active: true,
                valid_from_tax_year: { $lte: tax_year }
            },
            'priority',
            20
        );

        const advice = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein erfahrener Steuerplaner. Erstelle einen personalisierten Steuerplan.

PERSÖNLICHES PROFIL:
- Land: ${country}
- Jährliches Einkommen: ${annual_income}
- Einkommensquellen: ${JSON.stringify(income_sources)}
- Vermögen: ${JSON.stringify(assets)}
- Schulden: ${JSON.stringify(liabilities)}
- Steuerziele: ${JSON.stringify(tax_goals)}
- Steuerjahr: ${tax_year}

VERFÜGBARE STEUERREGELN & STRATEGIEN:
${taxRules.map(r => `• ${r.display_name}: ${r.description}`).join('\n')}

ERSTELLE EINEN PLAN MIT:
1. Top 3 Optimierungsmöglichkeiten (mit geschätztem Sparpotenzial)
2. Empfohlene Deduktionen basierend auf Einkommen/Vermögen
3. Timing-Strategien (Verwirklichung von Verlusten, Verschiebung von Einkommen)
4. Strukturelle Empfehlungen (Körperschaftsform, etc. wenn relevant)
5. Kritische Compliance-Punkte
6. Risikobeurteilung
7. Nächste Schritte`,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    tax_savings_potential: { type: 'string' },
                    optimizations: { 
                        type: 'array',
                        items: { type: 'object' }
                    },
                    recommended_deductions: { type: 'array', items: { type: 'string' } },
                    timing_strategies: { type: 'string' },
                    structural_recommendations: { type: 'string' },
                    compliance_checkpoints: { type: 'array', items: { type: 'string' } },
                    risk_assessment: { type: 'string' },
                    next_steps: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        // Save advice to user's session/profile
        await base44.auth.updateMe({
            last_tax_plan_advice: new Date().toISOString(),
            last_tax_plan_advice_year: tax_year
        });

        return Response.json({
            success: true,
            advice,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
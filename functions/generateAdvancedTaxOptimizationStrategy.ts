import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced tax optimization strategy generator
 * Provides personalized strategies beyond simple deductions
 * Includes: investment tax implications, estate planning, business structures
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
            investment_portfolio,
            business_structure,
            dependents,
            country,
            tax_year,
            planning_horizon
        } = await req.json();

        // Fetch user tax profile
        const profiles = await base44.asServiceRole.entities.TaxProfile.filter(
            { user_email: user.email },
            '-updated_date',
            1
        );

        const profile = profiles[0] || {};

        // Fetch relevant tax rules
        const taxRules = await base44.asServiceRole.entities.TaxRule.filter(
            { is_active: true },
            'priority',
            20
        );

        const strategy = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein erfahrener Steuerplaner mit Expertise in Investitionen, Nachlassplanung und Unternehmensstrukturen.

BENUTZER-PROFIL:
- Komplexität: ${profile.profile_type || 'unknown'}
- Jahreseinkommen: ${annual_income}
- Einkommensquellen: ${JSON.stringify(income_sources || [])}
- Vermögen: ${JSON.stringify(assets || [])}
- Schulden: ${JSON.stringify(liabilities || [])}
- Investitionsportfolio: ${JSON.stringify(investment_portfolio || {})}
- Aktuelle Unternehmensstruktur: ${business_structure || 'keine'}
- Unterhaltsberechtigte: ${dependents || 0}
- Land: ${country}
- Steuerjahr: ${tax_year}
- Planungshorizont: ${planning_horizon || '5 Jahre'}

VERFÜGBARE STEUERREGELN:
${taxRules.map(r => `• ${r.display_name}: ${r.description}`).join('\n')}

ERSTELLE EINE UMFASSENDE STEUEROPITMIERUNGSSTRATEGIE MIT DIESEN STRATEGIEKATEGORIEN:

1. INVESTITIONSSTRATEGIE
   - Steuereffiziente Investitionsplatzierungen
   - Timing von Gewinnen/Verlusten
   - Diversifikationsempfehlungen mit Steuervorteil

2. UNTERNEHMENSSTRUKTUR
   - Analyse aktueller vs. optimaler Struktur
   - Gründung von Personengesellschaften/Kapitalgesellschaften
   - Erbschafts- und Schenkungssteuerstrategie

3. NACHLASSPLANUNG
   - Freibetrag-Optimierung
   - Trust/Stiftungsstrukturen (falls anwendbar)
   - Vorsorgevollmacht und Testament-Strategien

4. EINKOMMEN-SPLITTING & TIMING
   - Einkommen zwischen Ehepartnern/Entitäten verteilen
   - Periodisierung von Einkommen/Ausgaben
   - Verschiebung zwischen Jahren

5. PENSIONSPLANUNG
   - Rentierter Sparpläne
   - Selbstständigenversicherung Optimierung
   - Rückwirkende Rentenbeiträge

GEBE STRUKTURIERTE JSON ANTWORT:
{
  "current_tax_efficiency_score": 0.65,
  "potential_tax_efficiency_score": 0.85,
  "improvement_potential_amount": 15000,
  "strategies": [
    {
      "category": "category_name",
      "title": "Strategie Titel",
      "description": "Detaillierte Beschreibung",
      "tax_savings_potential": 5000,
      "implementation_complexity": "low|medium|high",
      "timeframe": "immediate|1-3 months|3-12 months|1-3 years",
      "risk_level": "low|medium|high",
      "required_actions": ["Aktion 1", "Aktion 2"],
      "legal_considerations": "Rechtliche Hinweise",
      "estimated_implementation_cost": 500
    }
  ],
  "investment_strategy": {
    "current_allocation": "Analyse der aktuellen Allokation",
    "tax_optimized_allocation": "Empfohlene Allokation mit Steuervorteil",
    "estimated_annual_tax_savings": 2000,
    "implementation_steps": ["Schritt 1", "Schritt 2"]
  },
  "business_structure_analysis": {
    "current_structure": "Aktuelle Struktur oder keine",
    "recommended_structure": "Empfohlene Struktur",
    "transition_path": "Wie man dorthin kommt",
    "advantages": ["Vorteil 1", "Vorteil 2"],
    "disadvantages": ["Nachteil 1"],
    "estimated_setup_cost": 2000,
    "annual_tax_savings": 3000
  },
  "estate_planning": {
    "current_plan": "Aktuelle Situation",
    "risks": ["Risiko 1", "Risiko 2"],
    "recommended_strategies": ["Strategie 1", "Strategie 2"],
    "beneficiary_optimization": "Optimierungsempfehlungen für Begünstigte",
    "estimated_tax_efficiency": "X% Effizienz in Erbschaftssteuer"
  },
  "priority_actions": [
    {
      "priority": 1,
      "action": "Aktion",
      "deadline": "2026-03-31",
      "expected_impact": 5000
    }
  ],
  "risks_and_compliance": {
    "compliance_checklist": ["Check 1", "Check 2"],
    "documentation_requirements": ["Dokument 1"],
    "audit_risk_mitigation": "Strategien zur Audit-Risikovermeidung"
  }
}`,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    current_tax_efficiency_score: { type: 'number' },
                    potential_tax_efficiency_score: { type: 'number' },
                    improvement_potential_amount: { type: 'number' },
                    strategies: { type: 'array', items: { type: 'object' } },
                    investment_strategy: { type: 'object' },
                    business_structure_analysis: { type: 'object' },
                    estate_planning: { type: 'object' },
                    priority_actions: { type: 'array', items: { type: 'object' } },
                    risks_and_compliance: { type: 'object' }
                }
            }
        });

        return Response.json({
            success: true,
            strategy,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating strategy:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
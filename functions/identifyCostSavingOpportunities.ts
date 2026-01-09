import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Identifies cost-saving opportunities using AI analysis
 * Compares spending against industry benchmarks and best practices
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { analysis_months = 6 } = await req.json();

        console.log(`Identifying cost-saving opportunities for: ${user.email}`);

        // Get recent financial reports
        const reports = await base44.entities.FinancialReport.filter(
            { user_email: user.email },
            '-period_start',
            analysis_months
        );

        if (reports.length === 0) {
            return Response.json({
                success: false,
                message: 'No financial data available for analysis'
            });
        }

        // Aggregate spending data
        const aggregatedData = {
            total_spending: 0,
            category_breakdown: {},
            monthly_averages: {}
        };

        for (const report of reports) {
            aggregatedData.total_spending += report.metrics?.total_expenses || 0;
            const categories = report.analysis?.expense_analysis?.categories || {};
            
            for (const [cat, amount] of Object.entries(categories)) {
                aggregatedData.category_breakdown[cat] = 
                    (aggregatedData.category_breakdown[cat] || 0) + amount;
            }
        }

        // Use AI to identify opportunities
        const opportunityPrompt = `
Analysiere diese Ausgabendaten und identifiziere konkrete Kostensenkungsmöglichkeiten:

Zeitraum: ${analysis_months} Monate
Gesamtausgaben: ${aggregatedData.total_spending.toFixed(2)}€

Ausgabenaufschlüsselung nach Kategorie:
${JSON.stringify(aggregatedData.category_breakdown, null, 2)}

Basierend auf Best Practices und Branchenstudien:
1. Identifiziere überdurchschnittliche Ausgabenbereiche
2. Vorschlag konkrete Einsparungsmaßnahmen (z.B. Verhandlungen, Automatisierung, Konsolidierung)
3. Bewerte Implementierungsschwierigkeit und Zeithorizont
4. Quantifiziere potenzielle Einsparungen

Antworte mit strukturiertem JSON:
{
  "total_potential_savings": 1000,
  "savings_percentage": 15,
  "opportunities": [
    {
      "category": "category_name",
      "current_spending": 5000,
      "benchmark_spending": 4000,
      "potential_savings": 1000,
      "savings_percentage": 20,
      "recommendation": "Konkrete Maßnahme",
      "implementation_difficulty": "easy|medium|complex",
      "timeline_weeks": 4,
      "priority": "high|medium|low"
    }
  ],
  "quick_wins": ["Maßnahme 1", "Maßnahme 2"],
  "strategic_initiatives": ["Initiative 1", "Initiative 2"]
}`;

        const opportunityResponse = await base44.integrations.Core.InvokeLLM({
            prompt: opportunityPrompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    total_potential_savings: { type: 'number' },
                    savings_percentage: { type: 'number' },
                    opportunities: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                current_spending: { type: 'number' },
                                potential_savings: { type: 'number' },
                                recommendation: { type: 'string' },
                                implementation_difficulty: { type: 'string' },
                                timeline_weeks: { type: 'number' },
                                priority: { type: 'string' }
                            }
                        }
                    },
                    quick_wins: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    strategic_initiatives: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        // Send notification about opportunities
        if (opportunityResponse.total_potential_savings > 0) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: user.email,
                notification_type: 'cost_savings_identified',
                severity: 'info',
                message: `💰 ${opportunityResponse.total_potential_savings}€ potenzielle Einsparungen identifiziert (${opportunityResponse.savings_percentage}%)`,
                created_at: new Date().toISOString()
            });

            // Try to send Slack notification if available
            try {
                await base44.integrations.Slack.PostMessage({
                    channel: 'general',
                    text: `💰 Kostensenkungspotenzial erkannt: ${opportunityResponse.total_potential_savings}€ (${opportunityResponse.savings_percentage}%) für ${user.email}`
                });
            } catch (error) {
                console.warn('Slack notification failed:', error.message);
            }
        }

        return Response.json({
            success: true,
            analysis: opportunityResponse,
            analysis_period: analysis_months
        });

    } catch (error) {
        console.error('Error identifying cost-saving opportunities:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
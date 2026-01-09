import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Detects financial anomalies and generates alerts
 * Uses statistical analysis and AI to identify unusual patterns
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { analysis_months = 6, sensitivity = 'normal' } = await req.json();

        console.log(`Detecting financial anomalies for: ${user.email}`);

        // Get historical reports
        const reports = await base44.entities.FinancialReport.filter(
            { user_email: user.email },
            '-period_start',
            analysis_months
        );

        if (reports.length < 2) {
            return Response.json({
                success: false,
                message: 'Insufficient data for anomaly detection'
            });
        }

        // Calculate statistical baselines
        const baselines = calculateBaselines(reports);

        // Use AI for pattern analysis
        const anomalyPrompt = `
Analysiere diese Finanzdaten auf Anomalien und ungewöhnliche Muster:

Aktuelle Statistiken:
${JSON.stringify(baselines, null, 2)}

Sensitivitätsschwelle: ${sensitivity} (low=höhere Toleranz, high=niedriger Toleranz)

Identifiziere:
1. Plötzliche Sprünge in Einnahmen/Ausgaben (>20-30% Abweichung)
2. Unerwartete neue Ausgabenkategorien
3. Ausbleibende regelmäßige Einnahmen
4. Kategorienspezifische Anomalien
5. Mögliche Fehler oder Betrug

Antworte mit:
{
  "anomalies": [
    {
      "type": "unusual_spike|missing_income|new_category|pattern_break",
      "severity": "high|medium|low",
      "category": "category_name",
      "expected_value": 1000,
      "actual_value": 2500,
      "variance_percentage": 150,
      "description": "Was ist ungewöhnlich",
      "potential_causes": ["Ursache 1", "Ursache 2"],
      "recommended_action": "Was sollte überprüft werden"
    }
  ],
  "overall_risk_level": "high|medium|low",
  "summary": "Kurzzusammenfassung der Findings"
}`;

        const anomalyResponse = await base44.integrations.Core.InvokeLLM({
            prompt: anomalyPrompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    anomalies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                severity: { type: 'string' },
                                category: { type: 'string' },
                                expected_value: { type: 'number' },
                                actual_value: { type: 'number' },
                                variance_percentage: { type: 'number' },
                                description: { type: 'string' },
                                potential_causes: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                recommended_action: { type: 'string' }
                            }
                        }
                    },
                    overall_risk_level: { type: 'string' },
                    summary: { type: 'string' }
                }
            }
        });

        // Create alerts for each anomaly
        const alertCount = {
            high: 0,
            medium: 0,
            low: 0
        };

        for (const anomaly of anomalyResponse.anomalies || []) {
            alertCount[anomaly.severity]++;

            const severity = anomaly.severity === 'high' ? 'high' : 
                           anomaly.severity === 'medium' ? 'medium' : 'info';

            const message = `🔍 ${anomaly.description} (${anomaly.category || 'Allgemein'}): ${anomaly.variance_percentage.toFixed(0)}% Abweichung`;

            // Create notification
            await base44.asServiceRole.entities.Notification.create({
                user_email: user.email,
                notification_type: 'financial_anomaly_detected',
                severity: severity,
                message: message,
                related_id: anomaly.category,
                created_at: new Date().toISOString()
            });

            // Send critical alerts via Slack
            if (anomaly.severity === 'high') {
                try {
                    await base44.integrations.Slack.PostMessage({
                        channel: 'general',
                        text: `⚠️ *Finanzielle Anomalie erkannt*\n${message}\n_${anomaly.recommended_action}_`
                    });
                } catch (error) {
                    console.warn('Slack notification failed:', error.message);
                }
            }
        }

        // Log anomaly detection
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'financial_anomaly_detection',
            resource_type: 'FinancialReport',
            resource_name: `Detected ${alertCount.high + alertCount.medium + alertCount.low} anomalies`,
            timestamp: new Date().toISOString(),
            status: alertCount.high > 0 ? 'partial' : 'success'
        });

        return Response.json({
            success: true,
            anomalies: anomalyResponse.anomalies || [],
            overall_risk_level: anomalyResponse.overall_risk_level,
            alert_summary: alertCount,
            summary: anomalyResponse.summary
        });

    } catch (error) {
        console.error('Error detecting anomalies:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateBaselines(reports) {
    const statistics = {
        total_periods: reports.length,
        income_stats: {},
        expense_stats: {},
        category_stats: {}
    };

    const incomes = reports.map(r => r.metrics?.total_income || 0);
    const expenses = reports.map(r => r.metrics?.total_expenses || 0);

    statistics.income_stats = {
        average: incomes.reduce((a, b) => a + b, 0) / incomes.length,
        min: Math.min(...incomes),
        max: Math.max(...incomes),
        stddev: calculateStdDev(incomes)
    };

    statistics.expense_stats = {
        average: expenses.reduce((a, b) => a + b, 0) / expenses.length,
        min: Math.min(...expenses),
        max: Math.max(...expenses),
        stddev: calculateStdDev(expenses)
    };

    // Category statistics
    for (const report of reports) {
        const categories = report.analysis?.expense_analysis?.categories || {};
        for (const [cat, amount] of Object.entries(categories)) {
            if (!statistics.category_stats[cat]) {
                statistics.category_stats[cat] = [];
            }
            statistics.category_stats[cat].push(amount);
        }
    }

    return statistics;
}

function calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}
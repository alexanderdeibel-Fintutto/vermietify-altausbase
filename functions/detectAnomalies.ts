import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Detects anomalies in financial transactions and patterns
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactions, metrics, historical_patterns } = await req.json();

        console.log('Detecting financial anomalies');

        // Analyze transactions for anomalies
        const anomalies = detectTransactionAnomalies(
            transactions,
            metrics,
            historical_patterns
        );

        // Use AI for deeper pattern analysis
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `
Analyze the following financial anomalies and provide insights on potential causes and recommended actions:

Detected Anomalies:
${JSON.stringify(anomalies, null, 2)}

Metrics:
${JSON.stringify(metrics, null, 2)}

Provide:
1. Severity assessment (low/medium/high) for each anomaly
2. Likely causes
3. Recommended actions
4. If it's a concern or normal variance

Format as JSON.
            `,
            add_context_from_internet: false,
            response_json_schema: {
                type: 'object',
                properties: {
                    analysis: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                anomaly_type: { type: 'string' },
                                severity: { type: 'string' },
                                likely_causes: { type: 'array', items: { type: 'string' } },
                                recommended_actions: { type: 'array', items: { type: 'string' } },
                                is_concern: { type: 'boolean' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            anomalies,
            ai_analysis: aiAnalysis,
            total_anomalies: anomalies.length,
            high_severity: anomalies.filter(a => a.severity === 'high').length,
            detected_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error detecting anomalies:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function detectTransactionAnomalies(transactions, metrics, historicalPatterns) {
    const anomalies = [];

    if (!transactions || transactions.length === 0) return anomalies;

    transactions.forEach(tx => {
        // Check for unusually large transactions
        if (tx.amount > metrics.avg_transaction * 3) {
            anomalies.push({
                type: 'unusual_amount',
                severity: tx.amount > metrics.avg_transaction * 5 ? 'high' : 'medium',
                description: `Unusually large transaction: ${tx.amount.toLocaleString('de-DE')} €`,
                transaction_id: tx.id,
                amount: tx.amount
            });
        }

        // Check for unusual category spending
        const categoryAvg = historicalPatterns?.[tx.category] || 0;
        if (categoryAvg > 0 && tx.amount > categoryAvg * 2.5) {
            anomalies.push({
                type: 'category_anomaly',
                severity: 'medium',
                description: `${tx.category}: ${tx.amount.toLocaleString('de-DE')} € (avg: ${categoryAvg.toLocaleString('de-DE')} €)`,
                category: tx.category,
                amount: tx.amount,
                average: categoryAvg
            });
        }

        // Check for duplicate or suspicious patterns
        if (tx.description?.includes('test') || tx.description?.includes('duplicate')) {
            anomalies.push({
                type: 'suspicious_pattern',
                severity: 'low',
                description: `Potentially suspicious transaction: ${tx.description}`,
                transaction_id: tx.id
            });
        }
    });

    return anomalies;
}
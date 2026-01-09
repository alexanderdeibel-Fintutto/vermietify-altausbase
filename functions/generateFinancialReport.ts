import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate AI-driven financial reports with insights and trends
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            report_type, // 'monthly', 'quarterly', 'annual'
            period_start,
            period_end,
            include_sections, // ['summary', 'income', 'expenses', 'investments', 'crypto', 'trends']
            transactions = [],
            accounts = [],
            crypto_holdings = [],
            profile = {}
        } = await req.json();

        // Calculate financial metrics from data
        const metrics = calculateMetrics(transactions, accounts, crypto_holdings, period_start, period_end);

        // Generate AI insights
        const insights = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein Finanzanalyst. Erstelle einen detaillierten, actionable Bericht basierend auf folgenden Daten:

ZEITRAUM: ${period_start} bis ${period_end}
BERICHTSTYP: ${report_type}

FINANZMETRIKEN:
${JSON.stringify(metrics, null, 2)}

PROFIL: ${JSON.stringify(profile, null, 2)}

GENERIERE EINEN STRUKTURIERTEN REPORT MIT:
1. EXECUTIVE SUMMARY
   - Wichtigste Erkenntnisse und KPIs
   - Vergleich zum Vorjahr/Vorquartal

2. EINKOMMENSANALYSE
   - Quellen und Trends
   - Volatilität und Prognosen

3. AUSGABENANALYSE
   - Kategorien und Anteil
   - Anomalien und Optimierungschancen

4. INVESTITIONSBERICHT
   - Performance und Allokation
   - Steuerliche Auswirkungen

5. KRYPTOWERTE
   - Holdings und Volatilität
   - Gewinn-/Verlust-Analyse

6. TRENDS & PROGNOSEN
   - Finanzielle Entwicklung
   - Chancen und Risiken

GEBE STRUKTURIERTE JSON ANTWORT:
{
  "summary": "Executive Summary Text",
  "key_metrics": {
    "total_income": number,
    "total_expenses": number,
    "net_savings": number,
    "savings_rate_percent": number,
    "year_over_year_growth": number
  },
  "income_analysis": {
    "sources": [{"name": "string", "amount": number, "percent": number}],
    "average_monthly": number,
    "volatility": "low|medium|high",
    "trend": "up|stable|down",
    "insights": ["insight1", "insight2"]
  },
  "expense_analysis": {
    "categories": [{"name": "string", "amount": number, "percent": number}],
    "average_monthly": number,
    "unusual_transactions": ["transaction1"],
    "optimization_opportunities": ["opportunity1"],
    "insights": ["insight1"]
  },
  "investment_report": {
    "total_value": number,
    "performance_percent": number,
    "allocation": {"stocks": number, "bonds": number, "crypto": number},
    "tax_implications": "text",
    "recommendations": ["rec1"]
  },
  "crypto_analysis": {
    "total_value_usd": number,
    "holdings": [{"ticker": "BTC", "quantity": number, "value": number, "change_percent": number}],
    "realized_gains": number,
    "unrealized_gains": number,
    "tax_considerations": "text"
  },
  "trends": {
    "income_trend": "text with chart data",
    "expense_trend": "text",
    "savings_trajectory": "text",
    "forecast_next_quarter": "text"
  },
  "actionable_insights": [
    {"priority": "high|medium|low", "insight": "text", "impact": "text"}
  ]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    key_metrics: { type: 'object' },
                    income_analysis: { type: 'object' },
                    expense_analysis: { type: 'object' },
                    investment_report: { type: 'object' },
                    crypto_analysis: { type: 'object' },
                    trends: { type: 'object' },
                    actionable_insights: { type: 'array' }
                }
            }
        });

        // Save report
        const report = await base44.asServiceRole.entities.FinancialReport.create({
            user_email: user.email,
            report_type,
            period_start,
            period_end,
            metrics,
            analysis: insights,
            sections_included: include_sections,
            generated_at: new Date().toISOString(),
            status: 'completed'
        }).catch(() => null);

        return Response.json({
            success: true,
            report_id: report?.id,
            metrics,
            analysis: insights,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateMetrics(transactions, accounts, cryptoHoldings, periodStart, periodEnd) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    let income = 0, expenses = 0;
    const incomeByCategory = {};
    const expensesByCategory = {};

    if (transactions && Array.isArray(transactions)) {
        for (const tx of transactions) {
            const txDate = new Date(tx.date);
            if (txDate >= start && txDate <= end) {
                const amount = parseFloat(tx.amount) || 0;
                const category = tx.type || 'other';

                if (amount > 0) {
                    income += amount;
                    incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
                } else {
                    expenses += Math.abs(amount);
                    expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(amount);
                }
            }
        }
    }

    let cryptoValue = 0;
    if (cryptoHoldings && Array.isArray(cryptoHoldings)) {
        cryptoValue = cryptoHoldings.reduce((sum, h) => sum + (parseFloat(h.value_usd) || 0), 0);
    }

    let bankValue = 0;
    if (accounts && Array.isArray(accounts)) {
        bankValue = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
    }

    const daysDiff = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const monthsDiff = daysDiff / 30;

    return {
        period_days: daysDiff,
        total_income: Math.round(income),
        total_expenses: Math.round(expenses),
        net_savings: Math.round(income - expenses),
        savings_rate_percent: income > 0 ? Math.round((income - expenses) / income * 100) : 0,
        monthly_average_income: Math.round(income / monthsDiff),
        monthly_average_expenses: Math.round(expenses / monthsDiff),
        income_sources: incomeByCategory,
        expense_categories: expensesByCategory,
        total_crypto_value: Math.round(cryptoValue),
        total_bank_value: Math.round(bankValue),
        total_assets: Math.round(cryptoValue + bankValue)
    };
}
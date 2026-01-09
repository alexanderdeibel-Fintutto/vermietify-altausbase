import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Exports financial reports to CSV format
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            report_type,
            period_start,
            period_end,
            categories = []
        } = await req.json();

        console.log(`Generating CSV export for: ${report_type}`);

        let csvContent = '';

        // Generate CSV based on report type
        if (report_type === 'financial_trends') {
            csvContent = await generateFinancialTrendsCSV(base44, user.email, period_start, period_end, categories);
        } else if (report_type === 'cost_optimization') {
            csvContent = await generateCostOptimizationCSV(base44, user.email, period_start, period_end, categories);
        } else if (report_type === 'forecast') {
            csvContent = await generateForecastCSV(base44, user.email);
        }

        if (!csvContent) {
            return Response.json({ error: 'No report data found' }, { status: 404 });
        }

        console.log('CSV export generated successfully');

        // Convert to Blob/Buffer for download
        const encoder = new TextEncoder();
        const csvBytes = encoder.encode(csvContent);

        return new Response(csvBytes, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${report_type}_${period_start}_${period_end}.csv"`
            }
        });

    } catch (error) {
        console.error('Error generating CSV export:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function generateFinancialTrendsCSV(base44, userEmail, periodStart, periodEnd, categories) {
    const reports = await base44.entities.FinancialReport.filter(
        { user_email: userEmail },
        '-period_start',
        10
    );

    const filtered = reports.filter(r =>
        new Date(r.period_start) >= new Date(periodStart) &&
        new Date(r.period_end) <= new Date(periodEnd)
    );

    let csv = 'Periode,Einkommen,Ausgaben,Sparquote,Kategorie,Betrag\n';

    for (const report of filtered) {
        const metrics = report.metrics || {};
        const expenses = metrics.expense_analysis?.categories || {};

        // Overall metrics
        csv += `"${report.period_start} bis ${report.period_end}",${metrics.total_income || 0},${metrics.total_expenses || 0},${metrics.savings_rate_percent || 0}%,"Gesamt",${metrics.net_savings || 0}\n`;

        // Category breakdown
        for (const [category, amount] of Object.entries(expenses)) {
            if (categories.length === 0 || categories.includes(category)) {
                csv += `"${report.period_start}","","","","${category}",${Math.round(amount)}\n`;
            }
        }
    }

    return csv;
}

async function generateCostOptimizationCSV(base44, userEmail, periodStart, periodEnd, categories) {
    const analyses = await base44.entities.CostOptimizationAnalysis.filter(
        { user_email: userEmail },
        '-analysis_date',
        5
    );

    const filtered = analyses.filter(a =>
        new Date(a.analysis_date) >= new Date(periodStart) &&
        new Date(a.analysis_date) <= new Date(periodEnd)
    );

    let csv = 'Analysedatum,Kategorie,Aktuelle Ausgaben,Sparpotential,Sparprozentsatz,Priorität,Schwierigkeit\n';

    for (const analysis of filtered) {
        const opps = analysis.cost_reduction_opportunities || [];

        for (const opp of opps) {
            if (categories.length === 0 || categories.includes(opp.category)) {
                csv += `"${new Date(analysis.analysis_date).toLocaleDateString('de-DE')}","${opp.category}",${opp.current_spending || 0},${opp.potential_savings || 0},${opp.savings_percentage || 0}%,"${opp.priority}","${opp.implementation_difficulty}"\n`;
            }
        }
    }

    return csv;
}

async function generateForecastCSV(base44, userEmail) {
    // This assumes a Forecast entity exists
    // Adjust based on actual data structure
    let csv = 'Monat,Prognostiziertes Einkommen,Prognostizierte Ausgaben,Prognostizierter Überschuss\n';

    // Placeholder - would fetch actual forecast data
    csv += '"Januar 2026","5000","3500","1500"\n';
    csv += '"Februar 2026","5000","3600","1400"\n';
    csv += '"März 2026","5200","3700","1500"\n';

    return csv;
}
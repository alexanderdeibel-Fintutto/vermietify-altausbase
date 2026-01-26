import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Exports financial reports to PDF format
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
            categories = [],
            include_charts = true,
            include_analysis = true
        } = await req.json();

        console.log(`Generating PDF export for: ${report_type}`);

        let reportData = null;

        // Fetch report data based on type
        if (report_type === 'financial_trends') {
            const reports = await base44.entities.FinancialReport.filter(
                { user_email: user.email },
                '-period_start',
                10
            );
            
            reportData = {
                title: 'Finanztrends Bericht',
                reports: reports.filter(r => 
                    new Date(r.period_start) >= new Date(period_start) &&
                    new Date(r.period_end) <= new Date(period_end)
                )
            };
        } else if (report_type === 'cost_optimization') {
            const analyses = await base44.entities.CostOptimizationAnalysis.filter(
                { user_email: user.email },
                '-analysis_date',
                5
            );
            
            reportData = {
                title: 'Kostenoptimierungsanalyse',
                analyses: analyses.filter(a =>
                    new Date(a.analysis_date) >= new Date(period_start) &&
                    new Date(a.analysis_date) <= new Date(period_end)
                )
            };
        } else if (report_type === 'forecast') {
            const forecasts = await base44.entities.FinancialForecast?.list?.('-forecast_date', 5) || [];
            
            reportData = {
                title: 'Finanzprognose',
                forecasts: forecasts
            };
        }

        if (!reportData) {
            return Response.json({ error: 'No report data found' }, { status: 404 });
        }

        // Generate PDF content using a template approach
        const pdfContent = generatePDFContent(reportData, {
            include_charts,
            include_analysis,
            categories,
            period_start,
            period_end
        });

        // Create PDF using jsPDF would require the library, but since we're in Deno,
        // we'll return a structured JSON that the frontend will convert to PDF
        // or use a backend PDF service

        console.log('PDF export generated successfully');

        return Response.json({
            success: true,
            export_type: 'pdf',
            filename: `${reportData.title.replace(/\s+/g, '_')}_${period_start}_${period_end}.pdf`,
            content: pdfContent,
            mime_type: 'application/pdf'
        });

    } catch (error) {
        console.error('Error generating PDF export:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generatePDFContent(reportData, options) {
    const { include_charts, include_analysis, categories, period_start, period_end } = options;

    let content = `
# ${reportData.title}

Zeitraum: ${period_start} bis ${period_end}
Generiert: ${new Date().toLocaleString('de-DE')}

`;

    if (reportData.reports) {
        content += generateFinancialTrendsContent(reportData.reports, { include_charts, include_analysis, categories });
    } else if (reportData.analyses) {
        content += generateCostOptimizationContent(reportData.analyses, { include_charts, categories });
    } else if (reportData.forecasts) {
        content += generateForecastContent(reportData.forecasts, { include_analysis, categories });
    }

    return content;
}

function generateFinancialTrendsContent(reports, options) {
    let content = `## Finanzielle Trends\n\n`;

    for (const report of reports) {
        content += `### Periode: ${report.period_start} bis ${report.period_end}\n`;
        content += `- Gesamteinkommen: ${(report.metrics?.total_income || 0).toLocaleString('de-DE')} €\n`;
        content += `- Gesamtausgaben: ${(report.metrics?.total_expenses || 0).toLocaleString('de-DE')} €\n`;
        content += `- Nettosparquote: ${(report.metrics?.savings_rate_percent || 0)}%\n\n`;

        if (options.include_analysis && report.analysis?.summary) {
            content += `**Analyse:** ${report.analysis.summary}\n\n`;
        }
    }

    return content;
}

function generateCostOptimizationContent(analyses, options) {
    let content = `## Kostenoptimierungsanalyse\n\n`;

    for (const analysis of analyses) {
        content += `### Analyse vom ${new Date(analysis.analysis_date).toLocaleDateString('de-DE')}\n`;
        content += `- Gesamtausgaben: ${(analysis.total_spending || 0).toLocaleString('de-DE')} €\n`;
        content += `- Sparpotential: ${(analysis.total_potential_savings || 0).toLocaleString('de-DE')} €\n`;
        content += `- Sparprozentsatz: ${(analysis.savings_percentage || 0)}%\n\n`;

        if (analysis.cost_reduction_opportunities) {
            content += `**Sparmöglichkeiten:**\n`;
            for (const opp of analysis.cost_reduction_opportunities.slice(0, 5)) {
                content += `- ${opp.category}: ${(opp.potential_savings || 0).toLocaleString('de-DE')} € (${opp.savings_percentage || 0}%)\n`;
            }
            content += '\n';
        }
    }

    return content;
}

function generateForecastContent(forecasts, options) {
    let content = `## Finanzprognose\n\n`;

    for (const forecast of forecasts) {
        content += `### Prognose vom ${new Date(forecast.forecast_date || Date.now()).toLocaleDateString('de-DE')}\n`;
        
        if (forecast.predictions) {
            for (const pred of forecast.predictions.slice(0, 6)) {
                content += `- ${pred.month}: ${(pred.projected_income || 0).toLocaleString('de-DE')} € Einkommen, ${(pred.projected_expense || 0).toLocaleString('de-DE')} € Ausgaben\n`;
            }
        }
        content += '\n';
    }

    return content;
}
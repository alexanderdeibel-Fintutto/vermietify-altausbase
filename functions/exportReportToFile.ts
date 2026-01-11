import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { report_type, report_data, format } = await req.json();

        if (!report_type || !report_data || !format) {
            return Response.json({ 
                error: 'report_type, report_data and format required' 
            }, { status: 400 });
        }

        if (format === 'csv') {
            const csv = generateCSV(report_type, report_data);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="report_${report_type}_${Date.now()}.csv"`
                }
            });
        } else if (format === 'json') {
            const json = JSON.stringify(report_data, null, 2);
            return new Response(json, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="report_${report_type}_${Date.now()}.json"`
                }
            });
        } else {
            return Response.json({ error: 'Invalid format' }, { status: 400 });
        }

    } catch (error) {
        console.error('Export report error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateCSV(reportType, data) {
    let csv = '';

    if (reportType === 'financial') {
        csv += 'Finanzübersicht Report\n';
        csv += `Gebäude,${data.building_name}\n`;
        csv += `Zeitraum,"${data.reporting_period.from} bis ${data.reporting_period.to}"\n\n`;
        csv += 'Kennzahl,Betrag (€)\n';
        csv += `Gesamtmieteinnahmen,${data.financial_summary.total_rent_income}\n`;
        csv += `Kaltmiete,${data.financial_summary.base_rent}\n`;
        csv += `Nebenkosten,${data.financial_summary.utilities}\n`;
        csv += `Gesamtausgaben,${data.financial_summary.total_expenses}\n`;
        csv += `Monatlicher Reingewinn,${data.financial_summary.monthly_net_income}\n`;
        csv += `Jährlich projiziert,${data.financial_summary.yearly_projected}\n`;
    } else if (reportType === 'occupancy') {
        csv += 'Auslastungsbericht\n';
        csv += `Gebäude,${data.building_name}\n`;
        csv += `Stadt,${data.city}\n\n`;
        csv += 'Zusammenfassung\n';
        csv += `Insgesamt Einheiten,${data.occupancy_summary.total_units}\n`;
        csv += `Vermietete Einheiten,${data.occupancy_summary.occupied_units}\n`;
        csv += `Freie Einheiten,${data.occupancy_summary.vacant_units}\n`;
        csv += `Auslastungsquote (%),"${data.occupancy_summary.occupancy_rate}%"\n\n`;
        csv += 'Nach Etage\n';
        csv += 'Etage,Insgesamt,Vermietete,Auslastungsquote (%)\n';
        data.floor_breakdown.forEach(floor => {
            csv += `${floor.floor},${floor.total_units},${floor.occupied_units},"${floor.occupancy_rate}%"\n`;
        });
    } else if (reportType === 'tenants') {
        csv += 'Mieter-Statistik Report\n';
        csv += `Gebäude,${data.building_name}\n\n`;
        csv += 'Zusammenfassung\n';
        csv += `Gesamtmieter,${data.tenant_statistics.total_tenants}\n`;
        csv += `Aktuelle Bewohner,${data.tenant_statistics.current_occupants}\n`;
        csv += `Durchschnittliche Mietdauer (Monate),${data.tenant_statistics.average_tenure_months}\n`;
        csv += `Fluktuationsrate (%),"${data.tenant_statistics.churn_rate_percent}%"\n`;
        csv += `Im letzten Jahr gekündigt,${data.tenant_statistics.terminated_last_year}\n\n`;
        csv += 'Mietdauer-Verteilung\n';
        csv += `Minimum (Monate),${data.tenure_distribution.min_months}\n`;
        csv += `Maximum (Monate),${data.tenure_distribution.max_months}\n`;
        csv += `Median (Monate),${data.tenure_distribution.median_months}\n`;
    }

    return csv;
}
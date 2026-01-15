import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, reportType, frequency, recipients, format } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Erstelle Automation für regelmäßige Reports
        const automationConfig = {
            name: `${reportType} Report - ${buildingId}`,
            type: 'scheduled',
            frequency: frequency, // weekly, monthly, daily
            recipients: recipients,
            format: format, // PDF, CSV, EMAIL
            buildingId: buildingId,
            reportType: reportType,
            enabled: true,
            created_by: user.email,
            created_date: new Date().toISOString()
        };

        // Speichere Konfiguration
        const savedSchedule = await base44.entities.ReportSchedule.create(automationConfig);

        return new Response(JSON.stringify({
            success: true,
            schedule_id: savedSchedule.id,
            schedule: automationConfig,
            message: `Report-Zeitplan erstellt: ${frequency} ${reportType} Report`
        }), { status: 200 });

    } catch (error) {
        console.error('Schedule creation error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
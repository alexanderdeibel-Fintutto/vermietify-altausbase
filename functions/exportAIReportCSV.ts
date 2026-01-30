import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { startDate, endDate, groupBy = 'day' } = await req.json();

        const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
            created_date: { 
                $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                $lte: endDate || new Date().toISOString()
            }
        });

        // CSV Header
        let csv = 'Datum,User,Feature,Model,Input_Tokens,Output_Tokens,Cache_Creation,Cache_Read,Kosten_EUR,Kosten_ohne_Cache_EUR,Ersparnis_EUR,Response_Time_MS,Success\n';

        // Daten
        logs.forEach(log => {
            const row = [
                new Date(log.created_date).toISOString(),
                log.user_email,
                log.feature,
                log.model,
                log.input_tokens,
                log.output_tokens,
                log.cache_creation_tokens,
                log.cache_read_tokens,
                log.cost_eur.toFixed(4),
                log.cost_without_cache_eur.toFixed(4),
                (log.cost_without_cache_eur - log.cost_eur).toFixed(4),
                log.response_time_ms || 0,
                log.success ? 'Ja' : 'Nein'
            ];
            csv += row.join(',') + '\n';
        });

        // Zusammenfassung anhängen
        csv += '\n\nZUSAMMENFASSUNG\n';
        csv += `Gesamtkosten,${logs.reduce((sum, l) => sum + l.cost_eur, 0).toFixed(2)} EUR\n`;
        csv += `Gesamt-Requests,${logs.length}\n`;
        csv += `Durchschnitt pro Request,${(logs.reduce((sum, l) => sum + l.cost_eur, 0) / logs.length).toFixed(4)} EUR\n`;
        csv += `Cache-Ersparnis gesamt,${logs.reduce((sum, l) => sum + (l.cost_without_cache_eur - l.cost_eur), 0).toFixed(2)} EUR\n`;

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="ai_usage_report_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
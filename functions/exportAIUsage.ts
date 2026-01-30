import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format = 'csv', startDate, endDate } = await req.json();

    // Logs laden
    const filter = {};
    if (startDate || endDate) {
      filter.created_date = {};
      if (startDate) filter.created_date.$gte = startDate;
      if (endDate) filter.created_date.$lte = endDate;
    }

    const logs = await base44.entities.AIUsageLog.filter(filter);

    if (format === 'csv') {
      // CSV Export
      const csvRows = [
        ['Datum', 'User', 'Feature', 'Modell', 'Input Tokens', 'Output Tokens', 'Cache Read', 'Kosten (€)', 'Ersparnis (€)', 'Erfolg'].join(',')
      ];

      logs.forEach(log => {
        const savings = (log.cost_without_cache_eur || 0) - (log.cost_eur || 0);
        csvRows.push([
          new Date(log.created_date).toISOString(),
          log.user_email,
          log.feature,
          log.model,
          log.input_tokens,
          log.output_tokens,
          log.cache_read_tokens || 0,
          log.cost_eur.toFixed(4),
          savings.toFixed(4),
          log.success ? 'Ja' : 'Nein'
        ].join(','));
      });

      const csvContent = csvRows.join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ai-usage-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // JSON Export
    return Response.json({ 
      success: true, 
      data: logs,
      total_records: logs.length,
      total_cost: logs.reduce((sum, l) => sum + (l.cost_eur || 0), 0),
      exported_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { report_id, format } = body;

    const report = await base44.entities.Report.get(report_id);
    
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    let content = '';
    
    if (format === 'csv') {
      const data = JSON.parse(report.data || '{}');
      content = Object.entries(data).map(([k, v]) => `${k},${v}`).join('\n');
    } else {
      content = JSON.stringify(JSON.parse(report.data || '{}'), null, 2);
    }

    return new Response(content, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename=report_${report.id}.${format}`
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
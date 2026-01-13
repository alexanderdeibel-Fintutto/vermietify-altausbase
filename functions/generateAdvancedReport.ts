import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, metrics, chartType, dateRange } = await req.json();

    // Generate report data based on type
    let reportData = [];
    const now = new Date();

    // Mock data generation based on type
    if (type === 'financial') {
      reportData = [
        { month: 'Jan', 'Gesamteinnahmen': 5200, 'Gesamtausgaben': 2800 },
        { month: 'Feb', 'Gesamteinnahmen': 5400, 'Gesamtausgaben': 2900 },
        { month: 'Mär', 'Gesamteinnahmen': 6200, 'Gesamtausgaben': 3100 }
      ];
    } else if (type === 'occupancy') {
      reportData = [
        { unit: 'Unit A', 'Belegungsquote': 95, 'Freie Einheiten': 5 },
        { unit: 'Unit B', 'Belegungsquote': 87, 'Freie Einheiten': 13 }
      ];
    }

    const report = {
      id: `report_${Date.now()}`,
      name: name,
      type: type,
      chartType: chartType,
      metrics: metrics,
      data: reportData,
      dateRange: dateRange,
      generatedAt: new Date(),
      generatedBy: user.email
    };

    return Response.json({ 
      success: true, 
      report: report,
      downloadUrl: `/api/report/${report.id}/download`
    });

  } catch (error) {
    console.error('Report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
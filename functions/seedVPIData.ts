import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const vpiData = [
      { year: 2023, month: 1, index_value: 118.6 },
      { year: 2023, month: 2, index_value: 119.2 },
      { year: 2023, month: 3, index_value: 119.8 },
      { year: 2023, month: 12, index_value: 123.4 },
      { year: 2024, month: 1, index_value: 124.1 },
      { year: 2024, month: 6, index_value: 126.5 },
      { year: 2024, month: 12, index_value: 128.2 },
      { year: 2025, month: 1, index_value: 129.0 },
      { year: 2025, month: 12, index_value: 132.5 },
      { year: 2026, month: 1, index_value: 133.2 }
    ];

    for (const vpi of vpiData) {
      const existing = await base44.asServiceRole.entities.VPIIndex.filter({ year: vpi.year, month: vpi.month });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.VPIIndex.create(vpi);
      }
    }

    return Response.json({ success: true, count: vpiData.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
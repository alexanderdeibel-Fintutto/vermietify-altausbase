import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // VPI Historical Data (2020-2026)
    const vpiData = [
      // 2020 (Base Year)
      { year: 2020, month: 1, index_value: 100.0, base_year: 2020, change_yoy: 0, source: 'destatis' },
      { year: 2020, month: 6, index_value: 100.3, base_year: 2020, change_yoy: 0.3, source: 'destatis' },
      { year: 2020, month: 12, index_value: 100.5, base_year: 2020, change_yoy: 0.5, source: 'destatis' },
      
      // 2021
      { year: 2021, month: 1, index_value: 101.2, base_year: 2020, change_yoy: 1.2, source: 'destatis' },
      { year: 2021, month: 6, index_value: 103.1, base_year: 2020, change_yoy: 2.8, source: 'destatis' },
      { year: 2021, month: 12, index_value: 105.8, base_year: 2020, change_yoy: 5.3, source: 'destatis' },
      
      // 2022
      { year: 2022, month: 1, index_value: 106.4, base_year: 2020, change_yoy: 5.1, source: 'destatis' },
      { year: 2022, month: 6, index_value: 110.2, base_year: 2020, change_yoy: 6.9, source: 'destatis' },
      { year: 2022, month: 12, index_value: 113.9, base_year: 2020, change_yoy: 7.7, source: 'destatis' },
      
      // 2023
      { year: 2023, month: 1, index_value: 114.2, base_year: 2020, change_yoy: 7.3, source: 'destatis' },
      { year: 2023, month: 3, index_value: 115.8, base_year: 2020, change_yoy: 7.8, source: 'destatis' },
      { year: 2023, month: 6, index_value: 116.5, base_year: 2020, change_yoy: 5.7, source: 'destatis' },
      { year: 2023, month: 9, index_value: 117.2, base_year: 2020, change_yoy: 4.3, source: 'destatis' },
      { year: 2023, month: 12, index_value: 118.5, base_year: 2020, change_yoy: 4.0, source: 'destatis' },
      
      // 2024
      { year: 2024, month: 1, index_value: 119.2, base_year: 2020, change_yoy: 4.4, source: 'destatis' },
      { year: 2024, month: 3, index_value: 119.8, base_year: 2020, change_yoy: 3.5, source: 'destatis' },
      { year: 2024, month: 6, index_value: 120.5, base_year: 2020, change_yoy: 3.4, source: 'destatis' },
      { year: 2024, month: 9, index_value: 121.3, base_year: 2020, change_yoy: 3.5, source: 'destatis' },
      { year: 2024, month: 12, index_value: 122.1, base_year: 2020, change_yoy: 3.0, source: 'destatis' },
      
      // 2025
      { year: 2025, month: 1, index_value: 122.8, base_year: 2020, change_yoy: 3.0, source: 'destatis' },
      { year: 2025, month: 3, index_value: 123.5, base_year: 2020, change_yoy: 3.1, source: 'destatis' },
      { year: 2025, month: 6, index_value: 124.2, base_year: 2020, change_yoy: 3.1, source: 'destatis' },
      { year: 2025, month: 9, index_value: 124.8, base_year: 2020, change_yoy: 2.9, source: 'destatis' },
      { year: 2025, month: 12, index_value: 125.4, base_year: 2020, change_yoy: 2.7, source: 'destatis' },
      
      // 2026
      { year: 2026, month: 1, index_value: 126.1, base_year: 2020, change_yoy: 2.7, source: 'destatis' }
    ];

    // Delete existing data
    const existing = await base44.asServiceRole.entities.VPIIndex.list();
    for (const item of existing) {
      await base44.asServiceRole.entities.VPIIndex.delete(item.id);
    }

    // Insert new data
    for (const item of vpiData) {
      await base44.asServiceRole.entities.VPIIndex.create(item);
    }

    return Response.json({ 
      success: true, 
      message: `${vpiData.length} VPI-Datensätze erstellt` 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
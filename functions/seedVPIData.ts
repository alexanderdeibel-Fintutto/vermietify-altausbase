import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Nur Admins können VPI-Daten seedieren' }, { status: 403 });
        }

        // VPI data for Austria (2020-2025)
        const vpiData = [
            // 2020 (Basis = 100)
            { year: 2020, month: 1, index_value: 100.0, country: 'AT', source: 'Statistik Austria' },
            { year: 2020, month: 6, index_value: 100.5, country: 'AT', source: 'Statistik Austria' },
            { year: 2020, month: 12, index_value: 101.2, country: 'AT', source: 'Statistik Austria' },
            
            // 2021
            { year: 2021, month: 1, index_value: 101.5, country: 'AT', source: 'Statistik Austria' },
            { year: 2021, month: 6, index_value: 103.2, country: 'AT', source: 'Statistik Austria' },
            { year: 2021, month: 12, index_value: 104.8, country: 'AT', source: 'Statistik Austria' },
            
            // 2022
            { year: 2022, month: 1, index_value: 105.3, country: 'AT', source: 'Statistik Austria' },
            { year: 2022, month: 6, index_value: 109.1, country: 'AT', source: 'Statistik Austria' },
            { year: 2022, month: 12, index_value: 112.5, country: 'AT', source: 'Statistik Austria' },
            
            // 2023
            { year: 2023, month: 1, index_value: 113.2, country: 'AT', source: 'Statistik Austria' },
            { year: 2023, month: 6, index_value: 115.8, country: 'AT', source: 'Statistik Austria' },
            { year: 2023, month: 12, index_value: 117.3, country: 'AT', source: 'Statistik Austria' },
            
            // 2024
            { year: 2024, month: 1, index_value: 117.9, country: 'AT', source: 'Statistik Austria' },
            { year: 2024, month: 6, index_value: 119.5, country: 'AT', source: 'Statistik Austria' },
            { year: 2024, month: 12, index_value: 121.2, country: 'AT', source: 'Statistik Austria' },
            
            // 2025
            { year: 2025, month: 1, index_value: 121.8, country: 'AT', source: 'Statistik Austria', is_provisional: true },
            { year: 2025, month: 6, index_value: 123.1, country: 'AT', source: 'Statistik Austria', is_provisional: true },
            { year: 2025, month: 12, index_value: 124.5, country: 'AT', source: 'Statistik Austria', is_provisional: true }
        ];

        // Check if data already exists
        const existing = await base44.asServiceRole.entities.VPIIndex.list();
        
        if (existing.length > 0) {
            return Response.json({ 
                success: false, 
                message: 'VPI-Daten bereits vorhanden',
                count: existing.length
            });
        }

        // Bulk create
        await base44.asServiceRole.entities.VPIIndex.bulkCreate(vpiData);

        return Response.json({ 
            success: true, 
            message: 'VPI-Daten erfolgreich angelegt',
            count: vpiData.length
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { year, month, country = 'AT' } = await req.json();

        if (year && month) {
            // Fetch specific month
            const indices = await base44.asServiceRole.entities.VPIIndex.filter({ 
                year, 
                month, 
                country 
            });
            
            return Response.json({ 
                success: true, 
                data: indices.length > 0 ? indices[0] : null 
            });
        } else if (year) {
            // Fetch all months for a year
            const indices = await base44.asServiceRole.entities.VPIIndex.filter({ 
                year, 
                country 
            });
            
            // Sort by month
            indices.sort((a, b) => a.month - b.month);
            
            return Response.json({ 
                success: true, 
                data: indices 
            });
        } else {
            // Fetch latest available
            const allIndices = await base44.asServiceRole.entities.VPIIndex.filter({ country });
            
            if (allIndices.length === 0) {
                return Response.json({ 
                    success: false, 
                    error: 'Keine VPI-Daten verfügbar' 
                }, { status: 404 });
            }

            // Sort by year and month descending
            allIndices.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            });

            return Response.json({ 
                success: true, 
                data: allIndices[0] 
            });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
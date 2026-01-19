import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { 
            aktuelle_miete, 
            start_year, 
            start_month, 
            end_year, 
            end_month,
            country = 'AT'
        } = await req.json();

        if (!aktuelle_miete || !start_year || !start_month || !end_year || !end_month) {
            return Response.json({ error: 'Alle Pflichtfelder müssen ausgefüllt sein' }, { status: 400 });
        }

        // Fetch VPI data for start and end period
        const startIndex = await base44.asServiceRole.entities.VPIIndex.filter({ 
            year: start_year, 
            month: start_month, 
            country 
        });
        
        const endIndex = await base44.asServiceRole.entities.VPIIndex.filter({ 
            year: end_year, 
            month: end_month, 
            country 
        });

        if (startIndex.length === 0 || endIndex.length === 0) {
            return Response.json({ 
                error: 'VPI-Daten für den angegebenen Zeitraum nicht verfügbar',
                details: `Start: ${startIndex.length}, End: ${endIndex.length}`
            }, { status: 404 });
        }

        const vpi_start = startIndex[0].index_value;
        const vpi_end = endIndex[0].index_value;
        
        // Calculate new rent based on VPI change
        const indexaenderung = ((vpi_end - vpi_start) / vpi_start) * 100;
        const neue_miete = aktuelle_miete * (vpi_end / vpi_start);
        const erhoehung_absolut = neue_miete - aktuelle_miete;
        const erhoehung_prozent = ((neue_miete - aktuelle_miete) / aktuelle_miete) * 100;

        const result = {
            aktuelle_miete,
            neue_miete: Math.round(neue_miete * 100) / 100,
            erhoehung_absolut: Math.round(erhoehung_absolut * 100) / 100,
            erhoehung_prozent: Math.round(erhoehung_prozent * 100) / 100,
            vpi_start,
            vpi_end,
            indexaenderung: Math.round(indexaenderung * 100) / 100,
            start_period: `${start_month}/${start_year}`,
            end_period: `${end_month}/${end_year}`
        };

        return Response.json({ success: true, result });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { anlageVId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // AnlageV mit Einnahmen & Kosten laden
        const anlageVList = await base44.entities.AnlageV.list();
        const anlageV = anlageVList.find(a => a.id === anlageVId);
        if (!anlageV) {
            return new Response(JSON.stringify({ error: 'AnlageV not found' }), { status: 404 });
        }

        const [einnahmen, kosten] = await Promise.all([
            base44.entities.AnlageVEinnahmen.filter({ anlage_v_id: anlageVId }),
            base44.entities.AnlageVWerbungskosten.filter({ anlage_v_id: anlageVId })
        ]);

        const building = await base44.entities.Building.list();
        const buildingData = building.find(b => b.id === anlageV.building_id);

        // DATEV CSV Format (Kopfzeile + Datensätze)
        let csv = 'Beschreibung;Kategorie;Betrag;Typ\n';

        // Einnahmen
        csv += `"Einnahmen aus Vermietung ${anlageV.tax_year}";HEADER;"";REVENUE\n`;
        einnahmen.forEach(e => {
            csv += `"${e.description}";${e.category};${e.amount.toFixed(2)};REVENUE\n`;
        });

        csv += `"Summe Einnahmen";;${anlageV.total_rentals.toFixed(2)};SUBTOTAL\n\n`;

        // Werbungskosten
        csv += `"Werbungskosten ${anlageV.tax_year}";HEADER;"";EXPENSE\n`;
        kosten.forEach(k => {
            csv += `"${k.description}";${k.category};${k.amount.toFixed(2)};EXPENSE\n`;
        });

        csv += `"Summe Werbungskosten";;${anlageV.total_expenses.toFixed(2)};SUBTOTAL\n\n`;

        // Ergebnis
        csv += `"Gewinn/Verlust";;${anlageV.net_income.toFixed(2)};TOTAL\n`;

        const csvBytes = new TextEncoder().encode(csv);

        return new Response(csvBytes, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename=AnlageV_DATEV_${anlageV.tax_year}.csv`
            }
        });

    } catch (error) {
        console.error('Error exporting DATEV:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
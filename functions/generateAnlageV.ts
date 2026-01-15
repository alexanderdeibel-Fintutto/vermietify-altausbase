import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, taxYear } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Existierende AnlageV laden oder erstellen
        let anlageV = await base44.entities.AnlageV.filter({
            building_id: buildingId,
            tax_year: taxYear
        });

        if (!anlageV.length) {
            anlageV = await base44.entities.AnlageV.create({
                building_id: buildingId,
                tax_year: taxYear,
                status: 'DRAFT'
            });
            anlageV = [anlageV];
        }

        const anlageVId = anlageV[0].id;

        // Einnahmen laden & summieren
        const einnahmen = await base44.entities.AnlageVEinnahmen.filter({
            anlage_v_id: anlageVId
        });

        const totalRentals = einnahmen.reduce((sum, e) => sum + e.amount, 0);

        // Werbungskosten laden & summieren
        const kosten = await base44.entities.AnlageVWerbungskosten.filter({
            anlage_v_id: anlageVId
        });

        const totalExpenses = kosten
            .filter(k => k.is_deductible)
            .reduce((sum, k) => sum + k.amount, 0);

        const netIncome = totalRentals - totalExpenses;

        // AnlageV aktualisieren
        await base44.entities.AnlageV.update(anlageVId, {
            total_rentals: totalRentals,
            total_expenses: totalExpenses,
            net_income: netIncome,
            status: 'CALCULATED'
        });

        return new Response(JSON.stringify({
            success: true,
            anlageVId,
            summary: {
                totalRentals,
                totalExpenses,
                netIncome,
                einnahmenCount: einnahmen.length,
                kostenCount: kosten.length
            }
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating AnlageV:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
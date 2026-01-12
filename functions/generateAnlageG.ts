import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_return_id, person } = await req.json();

        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ id: tax_return_id });
        if (!taxReturn) {
            return Response.json({ error: 'Tax return not found' }, { status: 404 });
        }

        // Prüfe ob gewerbliche Einkünfte vorliegen
        // Dies ist ein Platzhalter - in der Praxis müsste hier geprüft werden,
        // ob der User als gewerblicher Trader eingestuft ist
        
        const validationErrors = [];
        
        const existing = await base44.asServiceRole.entities.AnlageG.filter({ tax_return_id, person });

        const anlageGData = {
            tax_return_id,
            tax_year: taxReturn.tax_year,
            person,
            is_auto_generated: true,
            betriebsbezeichnung: 'Trading',
            zeile_4_gewinn_einnahmen: 0,
            zeile_5_gewinn_bilanz: 0,
            zeile_11_einnahmen: 0,
            zeile_12_ausgaben: 0,
            zeile_23_gewinn_verlust: 0,
            zeile_43_gewerbesteuer: 0,
            anlage_eur_beigefuegt: false,
            validation_errors: validationErrors,
            is_valid: validationErrors.length === 0
        };

        let anlageG;
        if (existing.length > 0) {
            anlageG = await base44.asServiceRole.entities.AnlageG.update(existing[0].id, anlageGData);
        } else {
            anlageG = await base44.asServiceRole.entities.AnlageG.create(anlageGData);
        }

        return Response.json({ success: true, anlage_g: anlageG });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
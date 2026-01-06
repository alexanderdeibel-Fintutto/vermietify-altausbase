import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert Tilgungsplan für Kredit
 * Trennt Tilgung und Zinsen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { financing_id, months_to_generate } = await req.json();

        const financings = await base44.entities.Financing.filter({ id: financing_id });
        if (financings.length === 0) {
            return Response.json({ error: 'Finanzierung nicht gefunden' }, { status: 404 });
        }

        const financing = financings[0];
        const kreditbetrag = financing.kreditbetrag;
        const zinssatz = financing.zinssatz / 100; // Prozent zu Dezimal
        const monthlyRate = financing.monatsrate;
        const laufzeitMonate = financing.laufzeit_monate;
        const startDate = new Date(financing.vertragsbeginn);

        const schedule = [];
        let restschuld = kreditbetrag;

        const monthsToCalc = months_to_generate || Math.min(12, laufzeitMonate);

        for (let month = 0; month < monthsToCalc; month++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + month);

            // Zinsen für diesen Monat
            const zinsen = restschuld * (zinssatz / 12);
            
            // Tilgung
            const tilgung = monthlyRate - zinsen;

            // Neue Restschuld
            restschuld = restschuld - tilgung;

            schedule.push({
                month: month + 1,
                due_date: dueDate.toISOString().split('T')[0],
                monthly_rate: monthlyRate,
                interest: Math.round(zinsen * 100) / 100,
                principal: Math.round(tilgung * 100) / 100,
                remaining_debt: Math.round(restschuld * 100) / 100,
                tilgung_booking: {
                    amount: Math.round(tilgung * 100) / 100,
                    description: `Kreditrate ${month + 1} - Tilgung`,
                    cost_category: 'Darlehen-Tilgung (nicht abzugsfähig)'
                },
                zinsen_booking: {
                    amount: Math.round(zinsen * 100) / 100,
                    description: `Kreditrate ${month + 1} - Zinsen`,
                    cost_category: 'Schuldzinsen'
                }
            });
        }

        return Response.json({
            success: true,
            financing_id,
            loan_amount: kreditbetrag,
            interest_rate: financing.zinssatz,
            monthly_rate: monthlyRate,
            total_months: laufzeitMonate,
            calculated_months: monthsToCalc,
            schedule: schedule,
            total_interest: schedule.reduce((sum, s) => sum + s.interest, 0),
            total_principal: schedule.reduce((sum, s) => sum + s.principal, 0)
        });

    } catch (error) {
        console.error('Generate loan schedule error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
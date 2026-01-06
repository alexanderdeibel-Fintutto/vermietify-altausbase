import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert AfA-Abschreibungsplan über Nutzungsdauer
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { afa_schedule_id, years_to_generate } = await req.json();

        const schedules = await base44.entities.AfASchedule.filter({ id: afa_schedule_id });
        if (schedules.length === 0) {
            return Response.json({ error: 'AfA-Plan nicht gefunden' }, { status: 404 });
        }

        const afaSchedule = schedules[0];
        const startYear = afaSchedule.start_year;
        const usefulLife = afaSchedule.useful_life_years;
        const annualAmount = afaSchedule.annual_amount;
        const currentYear = new Date().getFullYear();

        const yearsToCalc = years_to_generate || Math.min(10, usefulLife);
        const bookings = [];

        for (let i = 0; i < yearsToCalc; i++) {
            const year = startYear + i;
            
            // Nur zukünftige und aktuelle Jahre
            if (year < currentYear - 1) continue;
            
            // Ende der Nutzungsdauer erreicht
            if (year > startYear + usefulLife) break;

            bookings.push({
                year: year,
                due_date: `${year}-12-31`,
                amount: annualAmount,
                description: `AfA-Abschreibung ${afaSchedule.afa_type} ${year}`,
                cost_category: afaSchedule.afa_type === 'Gebäude' ? 'AfA-Gebäude' : 'AfA-Außenanlagen',
                is_future: year > currentYear
            });
        }

        return Response.json({
            success: true,
            afa_schedule_id,
            afa_type: afaSchedule.afa_type,
            start_year: startYear,
            end_year: startYear + usefulLife,
            annual_amount: annualAmount,
            afa_rate: afaSchedule.afa_rate,
            basis_amount: afaSchedule.basis_amount,
            bookings: bookings,
            total_amount: bookings.reduce((sum, b) => sum + b.amount, 0)
        });

    } catch (error) {
        console.error('Generate AfA schedule error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
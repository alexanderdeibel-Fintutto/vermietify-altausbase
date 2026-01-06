import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analysiert Mietvertrag und generiert monatliche Mietzahlungen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lease_contract_id, months_to_generate } = await req.json();

        const contracts = await base44.entities.LeaseContract.filter({ id: lease_contract_id });
        if (contracts.length === 0) {
            return Response.json({ error: 'Mietvertrag nicht gefunden' }, { status: 404 });
        }

        const contract = contracts[0];
        const startDate = new Date(contract.start_date);
        const endDate = contract.end_date ? new Date(contract.end_date) : null;
        const rentDueDay = contract.rent_due_day || 1;
        const totalRent = contract.total_rent;
        const baseRent = contract.base_rent;
        const utilities = contract.utilities || 0;
        const heating = contract.heating || 0;

        // Berechne wie viele Monate generiert werden sollen
        let monthsToCalc = months_to_generate || 12;
        if (endDate) {
            const maxMonths = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
            monthsToCalc = Math.min(monthsToCalc, maxMonths);
        }

        const payments = [];

        for (let i = 0; i < monthsToCalc; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(rentDueDay);

            const year = dueDate.getFullYear();
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');

            payments.push({
                month_number: i + 1,
                due_date: dueDate.toISOString().split('T')[0],
                payment_month: `${year}-${month}`,
                total_rent: totalRent,
                base_rent: baseRent,
                utilities: utilities,
                heating: heating,
                description: `Miete ${year}-${month}`,
                cost_category: 'Mieteinnahmen'
            });
        }

        // Lade Unit für Gebäudeinfo
        const units = await base44.entities.Unit.filter({ id: contract.unit_id });
        const unit = units.length > 0 ? units[0] : null;

        return Response.json({
            success: true,
            lease_contract_id,
            unit_id: contract.unit_id,
            building_id: unit?.building_id,
            start_date: contract.start_date,
            end_date: contract.end_date,
            rent_due_day: rentDueDay,
            total_rent: totalRent,
            months_generated: monthsToCalc,
            payments: payments,
            total_yearly_income: totalRent * 12
        });

    } catch (error) {
        console.error('Analyze lease contract error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
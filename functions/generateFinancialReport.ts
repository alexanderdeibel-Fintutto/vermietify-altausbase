import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id, date_from, date_to } = await req.json();

        if (!building_id) {
            return Response.json({ error: 'building_id required' }, { status: 400 });
        }

        // Get building
        const buildings = await base44.entities.Building.filter({ id: building_id });
        const building = buildings[0];

        if (!building) {
            return Response.json({ error: 'Building not found' }, { status: 404 });
        }

        // Get contracts for this building
        const contracts = await base44.entities.LeaseContract.filter({ unit_id: building_id });

        // Get units
        const units = await base44.entities.Unit.filter({ gebaeude_id: building_id });

        // Calculate financials
        const totalRentIncome = contracts.reduce((sum, c) => {
            if (c.status === 'active') {
                return sum + (c.total_rent || 0);
            }
            return sum;
        }, 0);

        const totalBaseRent = contracts.reduce((sum, c) => {
            if (c.status === 'active') {
                return sum + (c.base_rent || 0);
            }
            return sum;
        }, 0);

        const totalUtilities = contracts.reduce((sum, c) => {
            if (c.status === 'active') {
                return sum + (c.utilities || 0);
            }
            return sum;
        }, 0);

        // Get financial items (expenses)
        const financialItems = await base44.entities.FinancialItem.filter({ 
            building_id: building_id 
        });

        const totalExpenses = financialItems
            .filter(item => item.type === 'expense')
            .reduce((sum, item) => sum + (item.amount || 0), 0);

        const monthlyNettIncome = totalRentIncome - totalExpenses;
        const yearlySavings = monthlyNettIncome * 12;

        return Response.json({
            building_id: building.id,
            building_name: building.name,
            reporting_period: { from: date_from, to: date_to },
            financial_summary: {
                total_rent_income: parseFloat(totalRentIncome.toFixed(2)),
                base_rent: parseFloat(totalBaseRent.toFixed(2)),
                utilities: parseFloat(totalUtilities.toFixed(2)),
                total_expenses: parseFloat(totalExpenses.toFixed(2)),
                monthly_net_income: parseFloat(monthlyNettIncome.toFixed(2)),
                yearly_projected: parseFloat(yearlySavings.toFixed(2))
            },
            unit_count: units.length,
            active_contracts: contracts.filter(c => c.status === 'active').length
        });

    } catch (error) {
        console.error('Generate financial report error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
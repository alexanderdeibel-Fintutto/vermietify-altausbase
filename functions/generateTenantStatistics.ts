import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id } = await req.json();

        if (!building_id) {
            return Response.json({ error: 'building_id required' }, { status: 400 });
        }

        // Get building
        const buildings = await base44.entities.Building.filter({ id: building_id });
        const building = buildings[0];

        if (!building) {
            return Response.json({ error: 'Building not found' }, { status: 404 });
        }

        // Get contracts
        const contracts = await base44.entities.LeaseContract.filter({ unit_id: building_id });

        // Get all tenants
        const tenantIds = [...new Set(contracts.map(c => c.tenant_id))];
        const allTenants = await base44.entities.Tenant.list();
        const buildingTenants = allTenants.filter(t => tenantIds.includes(t.id));

        // Calculate tenure statistics
        const tenureData = [];
        contracts.forEach(contract => {
            if (contract.start_date && contract.end_date) {
                const start = new Date(contract.start_date);
                const end = new Date(contract.end_date);
                const months = (end - start) / (1000 * 60 * 60 * 24 * 30.44);
                tenureData.push(months);
            } else if (contract.start_date && contract.status === 'active') {
                const start = new Date(contract.start_date);
                const today = new Date();
                const months = (today - start) / (1000 * 60 * 60 * 24 * 30.44);
                tenureData.push(months);
            }
        });

        // Calculate averages
        const averageTenure = tenureData.length > 0 
            ? tenureData.reduce((a, b) => a + b, 0) / tenureData.length 
            : 0;

        // Churn rate - terminated contracts last year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const terminatedLastYear = contracts.filter(c => {
            if (c.termination_date) {
                const termDate = new Date(c.termination_date);
                return termDate > oneYearAgo;
            }
            return false;
        }).length;

        const churnRate = contracts.length > 0 
            ? ((terminatedLastYear / contracts.length) * 100)
            : 0;

        // Active contracts
        const activeContracts = contracts.filter(c => c.status === 'active');

        return Response.json({
            building_id: building.id,
            building_name: building.name,
            tenant_statistics: {
                total_tenants: buildingTenants.length,
                current_occupants: activeContracts.length,
                average_tenure_months: parseFloat(averageTenure.toFixed(2)),
                churn_rate_percent: parseFloat(churnRate.toFixed(2)),
                terminated_last_year: terminatedLastYear
            },
            tenure_distribution: {
                min_months: Math.min(...tenureData, 0),
                max_months: Math.max(...tenureData, 0),
                median_months: calculateMedian(tenureData)
            }
        });

    } catch (error) {
        console.error('Generate tenant statistics error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
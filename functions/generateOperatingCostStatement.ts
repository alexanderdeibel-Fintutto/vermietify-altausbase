import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, accountingYear, periodStart, periodEnd } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Units & Leases laden
        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const allLeases = await base44.entities.LeaseContract.list();
        
        // Alle Betriebskosten-Items für diesen Zeitraum
        const allCostItems = await base44.entities.OperatingCostItem.filter({ building_id: buildingId });
        const relevantCosts = allCostItems.filter(item => {
            const itemDate = new Date(item.invoice_date);
            return itemDate >= new Date(periodStart) && itemDate <= new Date(periodEnd);
        });

        // Allocations laden
        const allAllocations = await base44.entities.OperatingCostAllocation.list();

        // Pro Unit: Ausgaben, Vorauszahlungen, Balance berechnen
        const statementDetails = {};
        let totalCosts = 0;
        let totalPaid = 0;
        let totalRefunds = 0;
        let totalBalances = 0;

        units.forEach(unit => {
            const unitAllocations = allAllocations.filter(a => a.unit_id === unit.id);
            const costAmount = unitAllocations.reduce((sum, a) => sum + a.amount, 0);
            
            // Vorauszahlungen (vereinfacht: angenommen monatlich)
            const monthsDiff = Math.max(1, Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24 * 30)));
            const paidAdvance = (unit.operating_cost_advance || 0) * monthsDiff;
            
            let balance = costAmount - paidAdvance;
            const isRefund = balance < 0;
            const displayBalance = Math.abs(balance);

            statementDetails[unit.id] = {
                unitNumber: unit.unit_number,
                tenantEmail: allLeases.find(l => l.unit_id === unit.id)?.tenant_email || '',
                livingArea: unit.living_area,
                costAmount: parseFloat(costAmount.toFixed(2)),
                paidAdvance: parseFloat(paidAdvance.toFixed(2)),
                balance: parseFloat(balance.toFixed(2)),
                isRefund: isRefund,
                allocations: unitAllocations.map(a => ({
                    type: a.allocation_basis,
                    amount: a.amount
                }))
            };

            totalCosts += costAmount;
            totalPaid += paidAdvance;
            if (isRefund) {
                totalRefunds += displayBalance;
            } else {
                totalBalances += displayBalance;
            }
        });

        // OperatingCostStatement erstellen
        const statement = await base44.entities.OperatingCostStatement.create({
            building_id: buildingId,
            accounting_year: accountingYear,
            period_start: periodStart,
            period_end: periodEnd,
            status: 'CALCULATED',
            total_costs: parseFloat(totalCosts.toFixed(2)),
            total_paid: parseFloat(totalPaid.toFixed(2)),
            total_refunds: parseFloat(totalRefunds.toFixed(2)),
            total_balances: parseFloat(totalBalances.toFixed(2)),
            statement_data: JSON.stringify(statementDetails),
            deadline: addMonths(new Date(periodEnd), 1).toISOString().split('T')[0]
        });

        return new Response(JSON.stringify({
            success: true,
            statementId: statement.id,
            summary: {
                totalCosts: parseFloat(totalCosts.toFixed(2)),
                totalPaid: parseFloat(totalPaid.toFixed(2)),
                totalRefunds: parseFloat(totalRefunds.toFixed(2)),
                totalBalances: parseFloat(totalBalances.toFixed(2)),
                unitsCount: units.length
            }
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating statement:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function addMonths(date, months) {
    date.setMonth(date.getMonth() + months);
    return date;
}
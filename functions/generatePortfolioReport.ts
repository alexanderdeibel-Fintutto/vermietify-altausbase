import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id } = await req.json();

    const buildings = await base44.asServiceRole.entities.Building.filter({ company_id });
    const allUnits = await base44.asServiceRole.entities.Unit.filter({ company_id });
    
    const occupiedUnits = allUnits.filter(u => u.status === 'rented').length;
    const totalUnits = allUnits.length;
    const vacancyRate = totalUnits > 0 ? ((totalUnits - occupiedUnits) / totalUnits) * 100 : 0;

    // Calculate total rental income
    let totalRentalIncome = 0;
    const activeContracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      company_id, 
      status: 'active' 
    });
    activeContracts.forEach(c => totalRentalIncome += (c.monthly_rent || 0) * 12);

    // Calculate total expenses
    const currentYear = new Date().getFullYear();
    const budgets = await base44.asServiceRole.entities.PropertyBudget.filter({ 
      company_id, 
      year: currentYear 
    });
    let totalExpenses = 0;
    budgets.forEach(b => {
      const expenses = Object.values(b.actual_expenses || {}).reduce((a, c) => a + (c || 0), 0);
      totalExpenses += expenses;
    });

    const noi = totalRentalIncome - totalExpenses;

    // Calculate total debt
    const loans = await base44.asServiceRole.entities.Financing.filter({ company_id });
    const totalDebt = loans.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);

    // Calculate portfolio value (simplified)
    const portfolioValue = buildings.reduce((sum, b) => sum + (b.purchase_price || 0), 0);
    const equityRatio = portfolioValue > 0 ? ((portfolioValue - totalDebt) / portfolioValue) * 100 : 0;

    // Calculate average ROI
    const roiAnalyses = await base44.asServiceRole.entities.PropertyROI.filter({ company_id });
    const avgROI = roiAnalyses.length > 0 
      ? roiAnalyses.reduce((sum, r) => sum + (r.net_yield_percentage || 0), 0) / roiAnalyses.length
      : 0;

    const metrics = await base44.asServiceRole.entities.PortfolioMetrics.create({
      company_id,
      reporting_period: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      vacancy_rate: Math.round(vacancyRate * 100) / 100,
      total_rental_income: Math.round(totalRentalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      net_operating_income: Math.round(noi * 100) / 100,
      portfolio_value: portfolioValue,
      avg_roi: Math.round(avgROI * 100) / 100,
      total_debt: totalDebt,
      equity_ratio: Math.round(equityRatio * 100) / 100
    });

    return Response.json({ success: true, metrics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
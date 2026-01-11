import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { building_id, property_value, equity_invested } = await req.json();

    // Get all contracts for this building
    const building = await base44.asServiceRole.entities.Building.read(building_id);
    const units = await base44.asServiceRole.entities.Unit.filter({ building_id });
    
    let annualRent = 0;
    for (const unit of units) {
      const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
        unit_id: unit.id, 
        status: 'active' 
      });
      contracts.forEach(c => annualRent += (c.monthly_rent || 0) * 12);
    }

    // Get annual expenses
    const budgets = await base44.asServiceRole.entities.PropertyBudget.filter({ 
      building_id, 
      year: new Date().getFullYear() 
    });
    const annualExpenses = budgets[0] ? 
      Object.values(budgets[0].actual_expenses || {}).reduce((a, b) => a + (b || 0), 0) : 0;

    const noi = annualRent - annualExpenses;
    const grossYield = (annualRent / property_value) * 100;
    const netYield = (noi / property_value) * 100;
    
    // Cash-on-Cash: Annual cash flow / Equity invested
    const loans = await base44.asServiceRole.entities.Financing.filter({ building_id });
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);
    const annualDebtService = totalLoanAmount > 0 ? totalLoanAmount * 0.05 : 0; // Simplified
    const cashFlow = noi - annualDebtService;
    const cashOnCash = equity_invested > 0 ? (cashFlow / equity_invested) * 100 : 0;

    const roi = await base44.asServiceRole.entities.PropertyROI.create({
      building_id,
      company_id: building.company_id,
      calculation_date: new Date().toISOString().split('T')[0],
      property_value,
      annual_rental_income: Math.round(annualRent * 100) / 100,
      annual_expenses: Math.round(annualExpenses * 100) / 100,
      net_operating_income: Math.round(noi * 100) / 100,
      gross_yield_percentage: Math.round(grossYield * 100) / 100,
      net_yield_percentage: Math.round(netYield * 100) / 100,
      cash_on_cash_return: Math.round(cashOnCash * 100) / 100,
      equity_invested,
      loan_amount: totalLoanAmount
    });

    return Response.json({ success: true, roi });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, canton } = await req.json();

    if (!taxYear || !canton) {
      return Response.json({ error: 'Missing taxYear or canton' }, { status: 400 });
    }

    const investments = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
    const realEstates = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [];
    const otherIncomes = await base44.entities.OtherIncomeCH.filter({ tax_year: taxYear, canton }) || [];
    const cantonConfig = (await base44.entities.CantonConfig.filter({ canton_code: canton }) || [])[0];

    // Calculate income components
    const dividendIncome = investments.reduce((s, i) => s + (i.dividend_income || 0), 0);
    const interestIncome = investments.reduce((s, i) => s + (i.interest_income || 0), 0);
    const realizedGains = investments.reduce((s, i) => s + Math.max(0, i.capital_gains || 0), 0);
    const realizedLosses = investments.reduce((s, i) => s + Math.max(0, i.capital_losses || 0), 0);
    const rentalIncome = realEstates.reduce((s, r) => s + (r.rental_income || 0), 0);
    const otherIncome = otherIncomes.reduce((s, o) => s + (o.amount || 0), 0);

    const totalIncome = dividendIncome + interestIncome + realizedGains + rentalIncome + otherIncome;
    const deductions = realEstates.reduce((s, r) => s + (r.maintenance_costs || 0) + (r.property_tax || 0) + (r.insurance_costs || 0) + (r.mortgage_interest_deductible || 0), 0);
    const taxableIncome = Math.max(0, totalIncome - deductions - realizedLosses);

    // Get canton tax rates
    const federalRate = cantonConfig?.federal_income_tax_rate || 0.05;
    const cantonalRate = cantonConfig?.cantonal_income_tax_rate || 0.08;
    const communalRate = cantonConfig?.communal_income_tax_rate || 0.02;

    // Calculate taxes
    const federalTax = taxableIncome * federalRate;
    const cantonalTax = taxableIncome * cantonalRate;
    const communalTax = taxableIncome * communalRate;
    const totalIncomeTax = federalTax + cantonalTax + communalTax;

    // Wealth tax (simplified)
    const totalWealth = investments.reduce((s, i) => s + ((i.current_value || 0) * (i.quantity || 0)), 0) + realEstates.reduce((s, r) => s + (r.current_market_value || 0), 0);
    const wealthThreshold = cantonConfig?.wealth_tax_threshold || 500000;
    const wealthTax = Math.max(0, (totalWealth - wealthThreshold) * (cantonConfig?.wealth_tax_rate || 0.001));

    // Withholding taxes paid
    const withholdingTaxPaid = investments.reduce((s, i) => s + (i.withholding_tax_paid || 0), 0) + otherIncomes.reduce((s, o) => s + (o.withholding_tax_paid || 0), 0);

    // Calculate refund or payment due
    const totalTaxDue = totalIncomeTax + wealthTax;
    const taxRefundOrPayment = withholdingTaxPaid - totalTaxDue;

    return Response.json({
      summary: {
        taxable_income: taxableIncome,
        total_tax: totalTaxDue,
        withholding_tax_paid: withholdingTaxPaid,
        tax_refund_or_payment: taxRefundOrPayment
      },
      breakdown: {
        federal_tax: federalTax,
        cantonal_tax: cantonalTax,
        communal_tax: communalTax,
        wealth_tax: wealthTax,
        total_income_tax: totalIncomeTax
      },
      income_components: {
        dividend_income: dividendIncome,
        interest_income: interestIncome,
        realized_gains: realizedGains,
        realized_losses: realizedLosses,
        rental_income: rentalIncome,
        other_income: otherIncome,
        total_income: totalIncome
      },
      deductions,
      wealth: {
        total_wealth: totalWealth,
        wealth_threshold: wealthThreshold,
        wealth_tax: wealthTax
      },
      canton,
      tax_year: taxYear
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
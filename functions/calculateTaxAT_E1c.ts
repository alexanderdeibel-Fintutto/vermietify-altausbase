import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, properties = [] } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    let totalRentalIncome = 0;
    let totalExpenses = 0;
    let totalDividedExpenses = 0;

    // Verarbeite jede Immobilie
    for (const prop of properties) {
      const rentalIncome = prop.rental_income || 0;
      const operatingCosts = prop.operating_costs || 0;
      const maintenance = prop.maintenance || 0;
      const insurance = prop.insurance || 0;
      const mortgage_interest = prop.mortgage_interest || 0;
      const depreciation = prop.depreciation || 0;
      const repairs = prop.repairs || 0;
      const other_expenses = prop.other_expenses || 0;

      totalRentalIncome += rentalIncome;
      
      const propExpenses = operatingCosts + maintenance + insurance + mortgage_interest + depreciation + repairs + other_expenses;
      totalExpenses += propExpenses;
      totalDividedExpenses += propExpenses;
    }

    // Grundfreibetrag & Abzüge
    const basicDeduction = 730; // EUR pro Jahr Grundfreibetrag
    const expenseAllowance = Math.max(0, totalRentalIncome * 0.20); // 20% Werbungskosten oder tatsächliche

    const deductibleExpenses = Math.max(expenseAllowance, totalDividedExpenses);
    const taxableIncome = Math.max(0, totalRentalIncome - basicDeduction - deductibleExpenses);

    // Steuersätze AT (2024)
    const progressiveTaxRate = calculateProgressiveTaxAT(taxableIncome);

    const calculation = {
      tax_year: taxYear,
      total_rental_income: totalRentalIncome,
      basic_deduction: basicDeduction,
      deductible_expenses: deductibleExpenses,
      taxable_income: taxableIncome,
      tax_rate: progressiveTaxRate.rate,
      tax_amount: progressiveTaxRate.tax,
      solidarity_surcharge: progressiveTaxRate.tax * 0.055,
      total_tax: progressiveTaxRate.tax + (progressiveTaxRate.tax * 0.055),
      properties_count: properties.length,
      calculation_method: 'anlage_e1c',
      details: {
        rental_income_details: properties.map((p, i) => ({
          property_id: p.id || `Property ${i + 1}`,
          rental_income: p.rental_income || 0,
          expenses: (p.operating_costs || 0) + (p.maintenance || 0) + (p.insurance || 0) + (p.mortgage_interest || 0) + (p.depreciation || 0) + (p.repairs || 0) + (p.other_expenses || 0)
        }))
      }
    };

    return Response.json({
      status: 'success',
      calculation
    });
  } catch (error) {
    console.error('Calculate tax AT E1c error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateProgressiveTaxAT(income) {
  // Progressive Einkommensteuer AT 2024
  let tax = 0;
  
  if (income <= 11000) {
    tax = income * 0.0;
  } else if (income <= 18000) {
    tax = (income - 11000) * 0.20;
  } else if (income <= 31000) {
    tax = 1400 + (income - 18000) * 0.325;
  } else if (income <= 60000) {
    tax = 1400 + 4225 + (income - 31000) * 0.42;
  } else if (income <= 90000) {
    tax = 1400 + 4225 + 12180 + (income - 60000) * 0.48;
  } else if (income <= 1000000) {
    tax = 1400 + 4225 + 12180 + 14400 + (income - 90000) * 0.50;
  } else {
    tax = 1400 + 4225 + 12180 + 14400 + 455000 + (income - 1000000) * 0.55;
  }

  return {
    income,
    tax: Math.round(tax),
    rate: income > 0 ? (tax / income * 100).toFixed(2) : 0
  };
}
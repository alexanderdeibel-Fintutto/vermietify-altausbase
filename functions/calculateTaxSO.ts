import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    console.log(`Calculating Anlage SO for ${userId}, year ${taxYear}`);

    // Get all other income for this year
    const otherIncomes = await base44.asServiceRole.entities.OtherIncome.filter({
      created_by: userId,
      tax_year: taxYear
    });

    const FREIGRENZE = 600; // EUR

    // Calculate totals
    let totalIncome = 0;
    const incomeByType = {};
    const incomeDetails = [];

    for (const income of otherIncomes) {
      const netIncome = income.amount - (income.allowable_expenses || 0);
      totalIncome += netIncome;

      if (!incomeByType[income.income_type]) {
        incomeByType[income.income_type] = 0;
      }
      incomeByType[income.income_type] += netIncome;

      incomeDetails.push({
        id: income.id,
        description: income.description,
        amount: income.amount,
        expenses: income.allowable_expenses || 0,
        netIncome
      });
    }

    // Check 600€ threshold (not deductible!)
    const isExempt = totalIncome <= FREIGRENZE;
    const taxableAmount = isExempt ? 0 : totalIncome;

    const result = {
      taxYear,
      incomes: incomeDetails,
      totals: {
        grossIncome: otherIncomes.reduce((sum, i) => sum + i.amount, 0),
        deductibleExpenses: otherIncomes.reduce((sum, i) => sum + (i.allowable_expenses || 0), 0),
        netIncome: totalIncome,
        incomeByType
      },
      threshold: {
        freigrenze: FREIGRENZE,
        totalIncome,
        isExempt,
        taxable: taxableAmount,
        exemptionLost: isExempt ? 0 : FREIGRENZE
      }
    };

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Tax SO calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
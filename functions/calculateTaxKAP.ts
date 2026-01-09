import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, federalState = 'DE' } = await req.json();

    console.log(`Calculating Anlage KAP for ${userId}, year ${taxYear}, state ${federalState}`);

    // Get all investments for this year
    const investments = await base44.asServiceRole.entities.Investment.filter({
      created_by: userId,
      tax_year: taxYear
    });

    const SPARERPAUSCHBETRAG = 1000; // EUR für 2023+
    const ABGELTUNGSSTEUER_RATE = 0.25;
    const SOLIDARITAETSZUSCHLAG_RATE = 0.055;
    const KIRCHENSTEUER_RATE = ['BY', 'BW'].includes(federalState) ? 0.08 : 0.09;

    // Calculate totals
    let totalGrossIncome = 0;
    let totalWithheldTax = 0;
    let totalForeignTax = 0;

    const incomeByType = {};
    const investmentDetails = [];

    for (const inv of investments) {
      totalGrossIncome += inv.gross_income;
      totalWithheldTax += inv.withheld_tax || 0;
      totalForeignTax += inv.foreign_tax || 0;

      if (!incomeByType[inv.income_type]) {
        incomeByType[inv.income_type] = 0;
      }
      incomeByType[inv.income_type] += inv.gross_income;

      investmentDetails.push({
        id: inv.id,
        title: inv.title,
        grossIncome: inv.gross_income,
        incomeType: inv.income_type
      });
    }

    // Distribute Sparerpauschbetrag proportionally
    let allowanceUsed = 0;
    const allowanceDistribution = investments.map(inv => {
      if (totalGrossIncome === 0) return { ...inv, allowancePortion: 0 };
      const portion = Math.min(
        inv.gross_income,
        (inv.gross_income / totalGrossIncome) * SPARERPAUSCHBETRAG
      );
      allowanceUsed += portion;
      return { ...inv, allowancePortion: portion };
    });

    // Calculate taxable income
    const taxableIncome = Math.max(0, totalGrossIncome - allowanceUsed - totalForeignTax);
    const abgeltungssteuer = taxableIncome * ABGELTUNGSSTEUER_RATE;
    const solidaritaetszuschlag = abgeltungssteuer * SOLIDARITAETSZUSCHLAG_RATE;
    const kirchensteuer = abgeltungssteuer * KIRCHENSTEUER_RATE;

    // Summary
    const result = {
      taxYear,
      federalState,
      investments: investmentDetails,
      totals: {
        grossIncome: totalGrossIncome,
        allowanceUsed: Math.min(allowanceUsed, SPARERPAUSCHBETRAG),
        foreignTaxCredit: totalForeignTax,
        taxableIncome,
        incomeByType
      },
      calculations: {
        abgeltungssteuer: Math.round(abgeltungssteuer * 100) / 100,
        solidaritaetszuschlag: Math.round(solidaritaetszuschlag * 100) / 100,
        kirchensteuer: Math.round(kirchensteuer * 100) / 100,
        totalTaxWithheld: totalWithheldTax,
        taxRefund: Math.max(0, totalWithheldTax - (abgeltungssteuer + solidaritaetszuschlag + kirchensteuer))
      }
    };

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Tax KAP calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
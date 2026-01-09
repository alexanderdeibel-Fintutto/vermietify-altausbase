import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    console.log(`Validating tax data for ${userId}, year ${taxYear}`);

    const errors = [];
    const warnings = [];

    // Get all data
    const [investments, otherIncomes, capitalGains] = await Promise.all([
      base44.entities.Investment.filter({ tax_year: taxYear }),
      base44.entities.OtherIncome.filter({ tax_year: taxYear }),
      base44.entities.CapitalGain.filter({ tax_year: taxYear })
    ]);

    // Validate Investments
    for (const inv of investments) {
      if (!inv.title || inv.title.length === 0) {
        errors.push(`Investment ${inv.id}: Bezeichnung fehlt`);
      }
      if (!inv.institution || inv.institution.length === 0) {
        errors.push(`Investment ${inv.id}: Kreditinstitut fehlt`);
      }
      if (inv.gross_income < 0) {
        errors.push(`Investment ${inv.id}: Bruttoeinkommen darf nicht negativ sein`);
      }
      if (inv.gross_income > 1000000) {
        warnings.push(`Investment ${inv.id}: Ungewöhnlich hoher Betrag (${inv.gross_income}€)`);
      }
    }

    // Validate OtherIncomes
    for (const inc of otherIncomes) {
      if (!inc.description || inc.description.length === 0) {
        errors.push(`OtherIncome ${inc.id}: Beschreibung fehlt`);
      }
      if (inc.amount < 0) {
        errors.push(`OtherIncome ${inc.id}: Betrag darf nicht negativ sein`);
      }
      if (inc.allowable_expenses > inc.amount) {
        errors.push(`OtherIncome ${inc.id}: Werbungskosten dürfen den Betrag nicht übersteigen`);
      }
    }

    // Validate CapitalGains
    for (const gain of capitalGains) {
      if (!gain.description || gain.description.length === 0) {
        errors.push(`CapitalGain ${gain.id}: Beschreibung fehlt`);
      }
      const acquisitionDate = new Date(gain.acquisition_date);
      const saleDate = new Date(gain.sale_date);
      if (saleDate <= acquisitionDate) {
        errors.push(`CapitalGain ${gain.id}: Veräußerungsdatum muss nach Anschaffungsdatum liegen`);
      }
      if (gain.sale_price < 0 || gain.acquisition_costs < 0) {
        errors.push(`CapitalGain ${gain.id}: Preise dürfen nicht negativ sein`);
      }
    }

    // Sparerpauschbetrag check
    const totalGrossIncome = investments.reduce((sum, inv) => sum + inv.gross_income, 0);
    if (totalGrossIncome > 1000 && investments.length === 0) {
      warnings.push('Sparerpauschbetrag (1000€) wird überschritten, aber keine Investments eingetragen');
    }

    return Response.json({
      success: true,
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        investmentsCount: investments.length,
        otherIncomesCount: otherIncomes.length,
        capitalGainsCount: capitalGains.length
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
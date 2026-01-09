import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const errors = [];
    const warnings = [];

    // Fetch data
    const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

    // Validate investments
    for (const inv of investments) {
      if (!inv.gross_income || inv.gross_income <= 0) {
        errors.push(`Investment "${inv.title}": Bruttoeinkommen erforderlich`);
      }
      if (inv.gross_income > 1000000) {
        warnings.push(`Investment "${inv.title}": Betrag €${inv.gross_income} wirkt unrealistisch hoch`);
      }
      if (!inv.institution || inv.institution.length === 0) {
        errors.push(`Investment "${inv.title}": Finanzinstitut erforderlich`);
      }
    }

    // Validate other incomes
    for (const income of otherIncomes) {
      if (!income.amount || income.amount <= 0) {
        errors.push(`Sonstige Einkunft "${income.description}": Betrag erforderlich`);
      }
      if (!income.income_type) {
        errors.push(`Sonstige Einkunft "${income.description}": Einkunftsart erforderlich`);
      }
    }

    // Validate capital gains
    for (const gain of capitalGains) {
      if (gain.sale_date < gain.acquisition_date) {
        errors.push(`Veräußerung "${gain.description}": Verkaufsdatum vor Kaufdatum`);
      }
      if (gain.sale_price <= 0 || gain.acquisition_cost < 0) {
        errors.push(`Veräußerung "${gain.description}": Ungültige Beträge`);
      }
    }

    // Check sparer allowance
    const totalInvestmentIncome = investments.reduce((sum, inv) => sum + inv.gross_income, 0);
    if (totalInvestmentIncome > 730 && investments.length === 0) {
      warnings.push('Sparerfreibetrag (€730) könnte überschritten sein - KESt Berechnung notwendig');
    }

    return Response.json({
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        investmentsCount: investments.length,
        otherIncomesCount: otherIncomes.length,
        capitalGainsCount: capitalGains.length,
        totalInvestmentIncome: totalInvestmentIncome
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
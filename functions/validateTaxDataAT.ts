import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Validating AT tax data for ${taxYear}`);

    const [investments, otherIncomes, capitalGains] = await Promise.all([
      base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [],
      base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [],
      base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
    ]);

    const errors = [];
    const warnings = [];
    const info = [];

    // Validate investments
    for (const inv of investments) {
      if (!inv.title) errors.push(`Investment: Titel fehlt`);
      if (!inv.institution) errors.push(`Investment: Bank/Institution fehlt`);
      if (inv.gross_income < 0) errors.push(`Investment "${inv.title}": Bruttoertrag darf nicht negativ sein`);
      
      if (inv.withheld_tax_kest > inv.gross_income * 0.275) {
        warnings.push(`Investment "${inv.title}": KESt-Betrag scheint zu hoch`);
      }
    }

    // Validate other incomes
    for (const oi of otherIncomes) {
      if (!oi.description) errors.push(`Sonstige Einkunft: Beschreibung fehlt`);
      if (!oi.income_type) errors.push(`Sonstige Einkunft: Typ fehlt`);
      if (oi.amount <= 0) errors.push(`Sonstige Einkunft "${oi.description}": Betrag muss > 0 sein`);
    }

    // Validate capital gains
    for (const cg of capitalGains) {
      if (!cg.description) errors.push(`Veräußerungsgewinn: Beschreibung fehlt`);
      if (cg.sale_date && cg.acquisition_date) {
        const saleDate = new Date(cg.sale_date);
        const acqDate = new Date(cg.acquisition_date);
        if (saleDate < acqDate) errors.push(`Veräußerungsgewinn "${cg.description}": Verkaufsdatum liegt vor Kaufdatum`);
      }
      if (cg.sale_price <= 0 || cg.acquisition_cost <= 0) {
        errors.push(`Veräußerungsgewinn "${cg.description}": Preise müssen > 0 sein`);
      }
    }

    // Check minimum data completeness
    const hasInvestments = investments.length > 0;
    const hasOtherIncomes = otherIncomes.length > 0;
    const hasCapitalGains = capitalGains.length > 0;

    if (!hasInvestments && !hasOtherIncomes && !hasCapitalGains) {
      warnings.push('Keine Einnahmedaten für Steuerjahr gefunden');
    }

    const totalIncome = investments.reduce((s, i) => s + (i.gross_income || 0), 0) +
                        otherIncomes.reduce((s, i) => s + (i.amount || 0), 0);

    if (totalIncome > 0) {
      info.push(`Gesamteinkommen: €${totalIncome.toFixed(2)}`);
    }

    const isValid = errors.length === 0;

    return Response.json({
      isValid,
      errors,
      warnings,
      info,
      timestamp: new Date().toISOString(),
      summary: {
        errorsCount: errors.length,
        warningsCount: warnings.length,
        dataCount: {
          investments: investments.length,
          otherIncomes: otherIncomes.length,
          capitalGains: capitalGains.length
        }
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
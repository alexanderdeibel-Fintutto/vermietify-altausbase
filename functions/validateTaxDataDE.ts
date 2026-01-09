import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

    const errors = [];
    const warnings = [];
    const info = [];

    // Validate investments
    if (investments.length === 0) {
      info.push('Keine Kapitalerträge erfasst.');
    } else {
      investments.forEach((inv, idx) => {
        if (!inv.title) errors.push(`Kapitalanlage ${idx + 1}: Title erforderlich`);
        if ((inv.gross_income || 0) < 0) errors.push(`Kapitalanlage ${idx + 1}: Bruttoeinkommen ungültig`);
        if ((inv.withheld_tax_kest || 0) > (inv.gross_income || 0)) {
          warnings.push(`Kapitalanlage ${idx + 1}: Einbehaltene Steuer höher als Einkommen`);
        }
      });
    }

    // Validate other incomes
    otherIncomes.forEach((oi, idx) => {
      if (!oi.income_type) errors.push(`Sonstige Einkunft ${idx + 1}: Art erforderlich`);
      if ((oi.amount || 0) <= 0) errors.push(`Sonstige Einkunft ${idx + 1}: Betrag erforderlich`);
    });

    // Validate capital gains
    capitalGains.forEach((cg, idx) => {
      if (!cg.asset_type) errors.push(`Veräußerungsgewinn ${idx + 1}: Vermögensart erforderlich`);
      if ((cg.sale_price || 0) <= 0) errors.push(`Veräußerungsgewinn ${idx + 1}: Verkaufspreis erforderlich`);
      if (!cg.acquisition_date || !cg.sale_date) {
        errors.push(`Veräußerungsgewinn ${idx + 1}: Daten erforderlich`);
      }
    });

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

    return Response.json({
      status,
      errors,
      warnings,
      info,
      data_summary: {
        investments_count: investments.length,
        other_incomes_count: otherIncomes.length,
        capital_gains_count: capitalGains.length,
        total_capital_income: investments.reduce((s, i) => s + (i.gross_income || 0), 0),
        total_capital_gains: capitalGains.filter(c => !c.is_tax_exempt).reduce((s, c) => s + Math.max(0, c.gain_loss || 0), 0)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
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

    const errors = [];
    const warnings = [];
    const info = [];

    // Validate investments
    if (investments.length === 0) {
      warnings.push('Keine Wertschriften erfasst.');
    } else {
      investments.forEach((inv, idx) => {
        if (!inv.isin && !inv.title) errors.push(`Wertschrift ${idx + 1}: Fehlendes ISIN oder Titel`);
        if ((inv.current_value || 0) <= 0) errors.push(`Wertschrift ${idx + 1}: Ungültiger Marktwert`);
      });
    }

    // Validate real estates
    if (realEstates.length === 0) {
      info.push('Keine Liegenschaften erfasst.');
    } else {
      realEstates.forEach((re, idx) => {
        if (!re.address) errors.push(`Liegenschaft ${idx + 1}: Adresse fehlt`);
        if ((re.current_market_value || 0) <= 0) errors.push(`Liegenschaft ${idx + 1}: Marktwert erforderlich`);
      });
    }

    // Validate other incomes
    otherIncomes.forEach((oi, idx) => {
      if (!oi.income_type) errors.push(`Einkünfte ${idx + 1}: Art der Einkunft erforderlich`);
      if ((oi.amount || 0) <= 0) errors.push(`Einkünfte ${idx + 1}: Betrag erforderlich`);
    });

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

    return Response.json({
      status,
      errors,
      warnings,
      info,
      data_summary: {
        investments_count: investments.length,
        real_estates_count: realEstates.length,
        other_incomes_count: otherIncomes.length,
        total_investment_value: investments.reduce((s, i) => s + ((i.current_value || 0) * (i.quantity || 0)), 0),
        total_real_estate_value: realEstates.reduce((s, r) => s + (r.current_market_value || 0), 0)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
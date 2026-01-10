import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list(null, 500);
  const buildings = await base44.entities.Building.list(null, 100);

  const suggestions = [];

  // Check for AfA optimization
  const buildingsWithoutAfa = buildings.filter(b => !b.afa_rate);
  if (buildingsWithoutAfa.length > 0) {
    suggestions.push({
      title: 'AfA-Abschreibungen nutzen',
      description: `${buildingsWithoutAfa.length} Gebäude ohne AfA-Satz konfiguriert`,
      potential_savings: buildingsWithoutAfa.length * 5000
    });
  }

  // Check for missing deductions
  const nonDeductible = financialItems.filter(i => i.amount < 0 && !i.tax_deductible);
  if (nonDeductible.length > 10) {
    suggestions.push({
      title: 'Werbungskosten prüfen',
      description: `${nonDeductible.length} Ausgaben nicht als steuerlich absetzbar markiert`,
      potential_savings: 2000
    });
  }

  // Loss carryforward
  const totalLoss = financialItems
    .filter(i => i.amount < 0)
    .reduce((sum, i) => sum + Math.abs(i.amount), 0);
  
  if (totalLoss > 10000) {
    suggestions.push({
      title: 'Verlustvortrag nutzen',
      description: 'Verluste können in Folgejahren steuermindernd geltend gemacht werden',
      potential_savings: totalLoss * 0.3
    });
  }

  return Response.json({ suggestions });
});
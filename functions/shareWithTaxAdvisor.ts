import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, include_documents = true } = await req.json();

  const buildings = await base44.entities.Building.list(null, 100);
  const assets = await base44.entities.AssetPortfolio.list(null, 100);
  const financialItems = await base44.entities.FinancialItem.list('-date', 500);
  const taxForms = await base44.entities.TaxForm.list(null, 100);

  const exportData = {
    year,
    user_email: user.email,
    buildings_count: buildings.length,
    assets_count: assets.length,
    transactions_count: financialItems.length,
    tax_forms_count: taxForms.length,
    generated_at: new Date().toISOString()
  };

  await base44.entities.AdvisorPortal.create({
    user_email: user.email,
    data_snapshot: exportData,
    year,
    shared_at: new Date().toISOString(),
    access_granted: true
  });

  return Response.json({
    success: true,
    share_id: crypto.randomUUID(),
    message: 'Daten erfolgreich mit Steuerberater geteilt'
  });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list('-created_date', 1000);

  // DATEV CSV format
  const headers = ['Datum', 'Belegnummer', 'Buchungstext', 'Sollkonto', 'Habenkonto', 'Betrag', 'Währung'];
  const rows = financialItems.map(item => [
    new Date(item.created_date).toLocaleDateString('de-DE'),
    item.id,
    item.name,
    item.amount > 0 ? '8400' : '4800',
    item.amount > 0 ? '1200' : '1800',
    Math.abs(item.amount).toFixed(2),
    'EUR'
  ]);

  const csv = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  return Response.json({ csv });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list(null, 500);

  const datevData = financialItems.map(item => ({
    buchungstext: item.name,
    betrag: item.amount,
    datum: item.created_date
  }));

  return Response.json({ 
    success: true, 
    exported: datevData.length,
    data: datevData
  });
});
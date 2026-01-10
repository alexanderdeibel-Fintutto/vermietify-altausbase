import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allData = {
    financialItems: await base44.entities.FinancialItem.list(null, 2000),
    documents: await base44.entities.Document.list(null, 500),
    buildings: await base44.entities.Building.list(null, 100),
    timestamp: new Date().toISOString()
  };

  const backupJson = JSON.stringify(allData);
  const sizeKB = (backupJson.length / 1024).toFixed(1);

  return Response.json({ 
    success: true,
    id: Date.now().toString(),
    size: `${sizeKB} KB`,
    created_at: new Date().toISOString()
  });
});
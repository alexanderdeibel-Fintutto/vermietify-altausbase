import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const allData = {
    financialItems: await base44.asServiceRole.entities.FinancialItem.list(null, 5000),
    documents: await base44.asServiceRole.entities.Document.list(null, 1000),
    buildings: await base44.asServiceRole.entities.Building.list(null, 200),
    contracts: await base44.asServiceRole.entities.LeaseContract.list(null, 500),
    timestamp: new Date().toISOString()
  };

  const backupJson = JSON.stringify(allData);
  const backupFile = new Blob([backupJson], { type: 'application/json' });

  // In production: Upload to secure storage
  console.log(`Backup created: ${(backupJson.length / 1024).toFixed(0)} KB`);

  return Response.json({ 
    success: true, 
    size: backupJson.length,
    items: allData.financialItems.length + allData.documents.length
  });
});
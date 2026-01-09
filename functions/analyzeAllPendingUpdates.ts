import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const pendingUpdates = await base44.entities.TaxLawUpdate.filter({
      status: 'DETECTED'
    });
    
    const results = [];
    
    for (const update of pendingUpdates) {
      try {
        const analyzeResponse = await base44.functions.invoke('analyzeTaxLawChange', {
          tax_law_update_id: update.id
        });
        
        results.push({ id: update.id, title: update.title, ...analyzeResponse });
      } catch (e) {
        results.push({ id: update.id, error: e.message });
      }
    }
    
    const relevantUpdates = results.filter(r => r.status === 'PENDING_REVIEW');
    
    if (relevantUpdates.length > 0) {
      await base44.integrations.Core.SendEmail({
        to: 'admin@example.com',
        subject: `${relevantUpdates.length} neue Steueränderungen zur Prüfung`,
        body: `Es wurden ${relevantUpdates.length} neue Steueränderungen erkannt.\n\n` +
              relevantUpdates.map(u => `- ${u.title}`).join('\n')
      });
    }
    
    return Response.json({
      success: true,
      analyzed: results.length,
      pending_review: relevantUpdates.length,
      results
    });
  } catch (error) {
    console.error('Error analyzing pending updates:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
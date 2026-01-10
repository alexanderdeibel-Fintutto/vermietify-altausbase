import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Analyze data availability
    const [buildings, tenants, contracts, documents, tasks, payments, interactions] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Document.list(),
      base44.entities.BuildingTask.list(),
      base44.entities.Payment.list(),
      base44.entities.WidgetInteraction.filter({ user_email: user.email })
    ]);

    const suggestions = [];

    // Get usage-based scores
    const usageMap = {};
    interactions.forEach(i => {
      if (!usageMap[i.widget_id]) {
        usageMap[i.widget_id] = { 
          count: 0, 
          engagement: 0, 
          relevance: 0,
          lastUsed: null 
        };
      }
      usageMap[i.widget_id].count += i.interaction_count || 1;
      usageMap[i.widget_id].engagement = Math.max(usageMap[i.widget_id].engagement, i.engagement_score || 0);
      usageMap[i.widget_id].relevance = Math.max(usageMap[i.widget_id].relevance, i.relevance_score || 0);
      if (!usageMap[i.widget_id].lastUsed || new Date(i.last_interacted_at) > new Date(usageMap[i.widget_id].lastUsed)) {
        usageMap[i.widget_id].lastUsed = i.last_interacted_at;
      }
    });

    // Data-based suggestions
    const dataPoints = [
      { id: 'buildings', count: buildings.length, threshold: 0, reason: `${buildings.length} Gebäude` },
      { id: 'tenants', count: tenants.length, threshold: 5, reason: `${tenants.length} Mieter` },
      { id: 'contracts', count: contracts.length, threshold: 0, reason: `${contracts.length} Verträge` },
      { id: 'revenue', count: payments.length, threshold: 10, reason: `${payments.length} Zahlungen` },
      { id: 'tasks', count: tasks.filter(t => t.status !== 'completed').length, threshold: 5, reason: 'Offene Aufgaben vorhanden' },
      { id: 'documents', count: documents.length, threshold: 20, reason: `${documents.length} Dokumente` }
    ];

    dataPoints.forEach(dp => {
      if (dp.count >= (dp.threshold || 0)) {
        const usage = usageMap[dp.id];
        const priority = usage?.engagement > 50 ? 'high' : 
                        usage?.count > 3 ? 'high' : 
                        dp.count > 50 ? 'high' : 'medium';
        
        suggestions.push({
          id: dp.id,
          reason: dp.reason,
          priority,
          usage: usage ? {
            count: usage.count,
            engagement: Math.round(usage.engagement),
            lastUsed: usage.lastUsed
          } : null
        });
      }
    });

    // Special: document-analysis if many docs
    if (documents.length > 20) {
      const docAnalysisUsage = usageMap['document-analysis'];
      suggestions.push({
        id: 'document-analysis',
        reason: 'Viele Dokumente - KI-Analyse empfohlen',
        priority: docAnalysisUsage?.engagement > 40 ? 'high' : 'medium',
        usage: docAnalysisUsage
      });
    }

    // Role-based suggestions
    if (user.role === 'admin') {
      const notifUsage = usageMap['notifications'];
      suggestions.push({
        id: 'notifications',
        reason: 'Admin-Benachrichtigungen wichtig',
        priority: 'high',
        usage: notifUsage
      });
    }

    // Sort by priority and engagement
    const scored = suggestions.map(s => ({
      ...s,
      score: (s.priority === 'high' ? 100 : 50) + (s.usage?.engagement || 0)
    })).sort((a, b) => b.score - a.score);

    return Response.json({ suggestions: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
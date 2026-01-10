import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Analyze data availability
    const [buildings, tenants, contracts, documents, tasks, payments] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Document.list(),
      base44.entities.BuildingTask.list(),
      base44.entities.Payment.list()
    ]);

    const suggestions = [];

    // Suggest based on data
    if (buildings.length > 0) {
      suggestions.push({
        id: 'buildings',
        reason: `Sie haben ${buildings.length} Gebäude - Widget empfohlen`,
        priority: 'high'
      });
    }

    if (tenants.length > 5) {
      suggestions.push({
        id: 'tenants',
        reason: `Sie verwalten ${tenants.length} Mieter`,
        priority: 'high'
      });
    }

    if (contracts.length > 0) {
      suggestions.push({
        id: 'contracts',
        reason: `${contracts.length} aktive Verträge`,
        priority: 'medium'
      });
    }

    if (payments.length > 10) {
      suggestions.push({
        id: 'revenue',
        reason: 'Viele Zahlungen - Einnahmen-Widget hilfreich',
        priority: 'high'
      });
    }

    if (tasks.filter(t => t.status !== 'completed').length > 5) {
      suggestions.push({
        id: 'tasks',
        reason: 'Mehrere offene Aufgaben',
        priority: 'high'
      });
    }

    if (documents.length > 20) {
      suggestions.push({
        id: 'documents',
        reason: `${documents.length} Dokumente vorhanden`,
        priority: 'medium'
      });
      suggestions.push({
        id: 'document-analysis',
        reason: 'Viele Dokumente - KI-Analyse empfohlen',
        priority: 'medium'
      });
    }

    // Role-based suggestions
    if (user.role === 'admin') {
      suggestions.push({
        id: 'notifications',
        reason: 'Admin-Benachrichtigungen wichtig',
        priority: 'high'
      });
    }

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
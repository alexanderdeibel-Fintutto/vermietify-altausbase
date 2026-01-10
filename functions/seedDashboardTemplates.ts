import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templates = [
      {
        name: 'Verwalter Komplett',
        description: 'Vollständige Übersicht für Immobilienverwalter',
        target_role: 'admin',
        is_system: true,
        layout: [
          { id: 'quick-stats', component: 'QuickStatsWidget', size: 'full', order: 0, enabled: true },
          { id: 'buildings', component: 'BuildingsWidget', size: 'half', order: 1, enabled: true },
          { id: 'occupancy', component: 'OccupancyWidget', size: 'half', order: 2, enabled: true },
          { id: 'revenue', component: 'RevenueWidget', size: 'third', order: 3, enabled: true },
          { id: 'tenants', component: 'TenantsWidget', size: 'half', order: 4, enabled: true },
          { id: 'tasks', component: 'OpenTasksWidget', size: 'half', order: 5, enabled: true },
          { id: 'notifications', component: 'CriticalNotificationsWidget', size: 'half', order: 6, enabled: true }
        ]
      },
      {
        name: 'Finanz-Fokus',
        description: 'Dashboard für Buchhaltung und Finanzen',
        target_role: 'all',
        is_system: true,
        layout: [
          { id: 'revenue', component: 'RevenueWidget', size: 'third', order: 0, enabled: true },
          { id: 'budget', component: 'BudgetOverviewWidget', size: 'half', order: 1, enabled: true },
          { id: 'forecast', component: 'FinancialForecastWidget', size: 'half', order: 2, enabled: true },
          { id: 'document-analysis', component: 'DocumentAnalysisWidget', size: 'half', order: 3, enabled: true },
          { id: 'documents', component: 'DocumentsWidget', size: 'half', order: 4, enabled: true }
        ]
      },
      {
        name: 'Hausmeister',
        description: 'Aufgaben und Wartung im Fokus',
        target_role: 'user',
        is_system: true,
        layout: [
          { id: 'tasks', component: 'OpenTasksWidget', size: 'full', order: 0, enabled: true },
          { id: 'upcoming-tasks', component: 'UpcomingTasksWidget', size: 'half', order: 1, enabled: true },
          { id: 'buildings', component: 'BuildingsWidget', size: 'half', order: 2, enabled: true },
          { id: 'notifications', component: 'CriticalNotificationsWidget', size: 'half', order: 3, enabled: true }
        ]
      },
      {
        name: 'Minimal',
        description: 'Kompakte Übersicht',
        target_role: 'all',
        is_system: true,
        layout: [
          { id: 'quick-stats', component: 'QuickStatsWidget', size: 'full', order: 0, enabled: true },
          { id: 'tasks', component: 'OpenTasksWidget', size: 'half', order: 1, enabled: true },
          { id: 'notifications', component: 'CriticalNotificationsWidget', size: 'half', order: 2, enabled: true }
        ]
      }
    ];

    const created = await Promise.all(
      templates.map(t => base44.asServiceRole.entities.DashboardTemplate.create(t))
    );

    return Response.json({ 
      message: `${created.length} Templates erstellt`,
      templates: created 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
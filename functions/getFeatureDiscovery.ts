import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system state
    const stateResponse = await base44.functions.invoke('calculateSystemState', {});
    const { systemState } = stateResponse.data;

    // Get recent unlocks (last 24h)
    const recentUnlocks = await base44.entities.FeatureUnlock.filter({ user_id: user.id });
    const last24h = recentUnlocks.filter(u => {
      const unlockDate = new Date(u.created_date);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return unlockDate > dayAgo && !u.notification_shown;
    });

    // Feature discovery rules based on context
    const discoveries = [];

    // New user, has buildings but no tenants
    if (systemState.dataCompleteness.buildings > 0 && systemState.dataCompleteness.tenants === 0 && systemState.usage.daysSinceSignup < 7) {
      discoveries.push({
        id: 'add_tenants',
        title: 'Mieter hinzufügen',
        description: 'Du hast bereits Gebäude angelegt. Füge jetzt Mieter hinzu und erstelle automatisch Mietverträge.',
        actionPage: 'Tenants',
        priority: 10
      });
    }

    // Has tenants but no financial data
    if (systemState.dataCompleteness.tenants > 0 && systemState.dataCompleteness.invoices === 0 && systemState.usage.daysSinceSignup > 3) {
      discoveries.push({
        id: 'financial_tracking',
        title: 'Finanzen erfassen',
        description: 'Behalte den Überblick über Einnahmen und Ausgaben. Erfasse deine ersten Rechnungen und Mietzahlungen.',
        actionPage: 'Finanzen',
        priority: 9
      });
    }

    // Recently unlocked advanced feature
    if (last24h.length > 0) {
      const unlock = last24h[0];
      discoveries.push({
        id: `unlock_${unlock.feature_key}`,
        title: `Neues Feature: ${unlock.feature_key}`,
        description: 'Du hast gerade ein neues Feature freigeschaltet! Schau es dir an und teste die neuen Möglichkeiten.',
        actionPage: 'Dashboard',
        priority: 15
      });
    }

    // Has data but low quality score
    if (systemState.usage.dataQualityScore < 50 && systemState.usage.daysSinceSignup > 14) {
      discoveries.push({
        id: 'improve_data',
        title: 'Daten vervollständigen',
        description: 'Vervollständige deine Daten für bessere Auswertungen und Automatisierungen. Dein aktueller Score: ' + systemState.usage.dataQualityScore + '%',
        actionPage: 'Dashboard',
        priority: 7
      });
    }

    // Intermediate user without documents
    if (systemState.usage.userLevel === 'intermediate' && systemState.dataCompleteness.documents < 5) {
      discoveries.push({
        id: 'document_management',
        title: 'Dokumentenverwaltung',
        description: 'Speichere wichtige Dokumente digital und habe sie immer griffbereit. Erstelle automatisch Mietverträge und Abrechnungen.',
        actionPage: 'Documents',
        priority: 6
      });
    }

    // Sort by priority
    discoveries.sort((a, b) => b.priority - a.priority);

    // Return top discovery
    const discovery = discoveries[0] || null;

    return Response.json({ discovery });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
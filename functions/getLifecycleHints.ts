import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();

    // Get system state
    const stateResponse = await base44.functions.invoke('calculateSystemState', {});
    const { systemState } = stateResponse.data;

    const hints = [];

    // Q4: Betriebskostenabrechnung
    if (currentMonth >= 9 && currentMonth <= 11 && systemState.businessState.hasActiveTenants) {
      hints.push({
        id: 'year_end_operating_costs',
        title: 'Jahresende: Betriebskostenabrechnung',
        description: 'Das Jahr neigt sich dem Ende zu. Jetzt ist der ideale Zeitpunkt, mit der Vorbereitung der Betriebskostenabrechnungen zu beginnen.',
        actionPage: 'OperatingCosts',
        actionLabel: 'BK-Abrechnung starten',
        priority: 15
      });
    }

    // Januar-März: Steuersaison
    if (currentMonth >= 0 && currentMonth <= 2 && systemState.dataCompleteness.buildings > 0) {
      hints.push({
        id: 'tax_season_anlage_v',
        title: 'Steuersaison: Anlage V erstellen',
        description: 'Die Steuererklärungsfrist läuft. Erstelle jetzt deine Anlage V für vermietete Immobilien.',
        actionPage: 'TaxManagement',
        actionLabel: 'Anlage V starten',
        priority: 14
      });
    }

    // Juli: Mitte des Jahres - Zwischenauswertung
    if (currentMonth === 6 && systemState.usage.daysSinceSignup > 180 && systemState.dataCompleteness.invoices > 50) {
      hints.push({
        id: 'mid_year_review',
        title: 'Halbjahres-Auswertung',
        description: 'Perfekter Zeitpunkt für eine Zwischenauswertung deiner Finanzen. Wie läuft dein Jahr?',
        actionPage: 'ReportsPage',
        actionLabel: 'Auswertung erstellen',
        priority: 8
      });
    }

    // Dezember 1-15: Jahresabschluss-Vorbereitung
    if (currentMonth === 11 && currentDay <= 15 && systemState.dataCompleteness.invoices > 20) {
      hints.push({
        id: 'year_end_preparation',
        title: 'Jahresabschluss vorbereiten',
        description: 'Bereite deine Bücher für den Jahresabschluss vor. Prüfe offene Rechnungen und erfasse fehlende Belege.',
        actionPage: 'Finanzen',
        actionLabel: 'Buchhaltung prüfen',
        priority: 12
      });
    }

    // Neue Mieter im ersten Monat
    if (systemState.dataCompleteness.contracts > 0) {
      const contracts = await base44.entities.LeaseContract.list('-created_date', 5);
      const recentContracts = contracts.filter(c => {
        const created = new Date(c.created_date);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return created > monthAgo;
      });

      if (recentContracts.length > 0) {
        hints.push({
          id: 'new_tenant_welcome',
          title: 'Neue Mieter: Willkommenspaket',
          description: `Du hast ${recentContracts.length} neue${recentContracts.length > 1 ? '' : 'n'} Mieter. Versende ein Willkommenspaket mit wichtigen Informationen.`,
          actionPage: 'Kommunikation',
          actionLabel: 'Nachricht senden',
          priority: 10
        });
      }
    }

    // Versicherungen: Reminder vor Ablauf
    if (systemState.dataCompleteness.buildings > 0) {
      const insurances = await base44.entities.Insurance.list();
      const expiringInsurances = insurances.filter(ins => {
        if (!ins.valid_until) return false;
        const expiryDate = new Date(ins.valid_until);
        const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        return expiryDate < twoMonthsFromNow && expiryDate > now;
      });

      if (expiringInsurances.length > 0) {
        hints.push({
          id: 'insurance_renewal',
          title: 'Versicherungen laufen aus',
          description: `${expiringInsurances.length} Versicherung${expiringInsurances.length > 1 ? 'en' : ''} ${expiringInsurances.length > 1 ? 'laufen' : 'läuft'} bald aus. Prüfe Verlängerungen oder Wechselmöglichkeiten.`,
          actionPage: 'InsuranceManagement',
          actionLabel: 'Versicherungen prüfen',
          priority: 13
        });
      }
    }

    // Sort by priority and return top hint
    hints.sort((a, b) => b.priority - a.priority);
    const hint = hints[0] || null;

    return Response.json({ hint });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
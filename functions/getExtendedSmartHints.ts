import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stateResponse = await base44.functions.invoke('calculateSystemState', {});
    const { systemState } = stateResponse.data;

    const hints = [];

    // Data quality hints
    if (systemState.usage.dataQualityScore < 70 && systemState.dataCompleteness.buildings > 0) {
      const missingData = [];
      if (systemState.dataCompleteness.tenants === 0) missingData.push('Mieter');
      if (systemState.dataCompleteness.contracts === 0 && systemState.dataCompleteness.tenants > 0) missingData.push('Mietverträge');
      if (systemState.dataCompleteness.invoices < 5) missingData.push('Rechnungen');
      
      if (missingData.length > 0) {
        hints.push({
          id: 'improve_data_quality',
          title: 'Datenqualität verbessern',
          description: `Vervollständige deine Daten für bessere Auswertungen. Fehlt noch: ${missingData.join(', ')}`,
          actionPage: 'Dashboard',
          priority: 8
        });
      }
    }

    // Workflow optimization hints
    if (systemState.dataCompleteness.invoices > 20 && systemState.usage.daysSinceSignup > 30) {
      const categorizationRules = await base44.entities.CategorizationRule.list();
      if (categorizationRules.length < 3) {
        hints.push({
          id: 'setup_categorization_rules',
          title: 'Automatisierung einrichten',
          description: 'Erstelle Kategorisierungsregeln und spare Zeit bei der Buchhaltung.',
          actionPage: 'Finanzen',
          actionLabel: 'Regeln erstellen',
          priority: 7
        });
      }
    }

    // ELSTER setup hint
    if (systemState.dataCompleteness.buildings > 0 && systemState.usage.daysSinceSignup > 60) {
      const certificates = await base44.entities.ElsterCertificate.list();
      if (certificates.length === 0) {
        hints.push({
          id: 'setup_elster',
          title: 'ELSTER einrichten',
          description: 'Richte ELSTER ein für automatische Steuerübermittlung und spare Zeit bei der Steuererklärung.',
          actionPage: 'ElsterIntegration',
          actionLabel: 'ELSTER einrichten',
          priority: 9
        });
      }
    }

    // Document templates hint
    if (systemState.dataCompleteness.contracts > 2 && systemState.dataCompleteness.documents < 5) {
      hints.push({
        id: 'create_document_templates',
        title: 'Dokumentvorlagen erstellen',
        description: 'Erstelle Vorlagen für Mietverträge, Nebenkostenabrechnungen und mehr.',
        actionPage: 'Documents',
        actionLabel: 'Vorlagen erstellen',
        priority: 6
      });
    }

    // Banking integration hint
    if (systemState.dataCompleteness.bankAccounts === 0 && systemState.usage.daysSinceSignup > 7) {
      hints.push({
        id: 'connect_bank_account',
        title: 'Bankkonto verbinden',
        description: 'Verbinde dein Bankkonto und importiere Transaktionen automatisch.',
        actionPage: 'BankAccounts',
        actionLabel: 'Konto verbinden',
        priority: 10
      });
    }

    // Portfolio analytics hint
    if (systemState.dataCompleteness.buildings >= 3 && !systemState.usage.featureUsage.portfolioAnalytics) {
      hints.push({
        id: 'explore_portfolio_analytics',
        title: 'Portfolio-Analytics entdecken',
        description: 'Mit 3+ Gebäuden lohnt sich ein Blick auf Portfolio-weite Auswertungen.',
        actionPage: 'Analytics',
        actionLabel: 'Analytics öffnen',
        priority: 7
      });
    }

    // Tenant portal hint
    if (systemState.dataCompleteness.tenants >= 10 && !systemState.usage.featureUsage.tenantPortal) {
      hints.push({
        id: 'activate_tenant_portal',
        title: 'Mieter-Portal aktivieren',
        description: 'Bei 10+ Mietern spart ein Self-Service-Portal viel Zeit.',
        actionPage: 'TenantPortal',
        actionLabel: 'Portal aktivieren',
        priority: 8
      });
    }

    // Operating costs preparation
    const now = new Date();
    const currentMonth = now.getMonth();
    if (currentMonth >= 9 && systemState.businessState.hasActiveTenants) {
      const statements = await base44.entities.OperatingCostStatement.list();
      const thisYear = now.getFullYear();
      const hasCurrentYearStatement = statements.some(s => new Date(s.created_date).getFullYear() === thisYear);
      
      if (!hasCurrentYearStatement) {
        hints.push({
          id: 'prepare_operating_costs_q4',
          title: 'Nebenkostenabrechnung vorbereiten',
          description: 'Q4: Perfekter Zeitpunkt, alle Belege zu sammeln und die Nebenkostenabrechnung vorzubereiten.',
          actionPage: 'OperatingCosts',
          actionLabel: 'Vorbereitung starten',
          priority: 11
        });
      }
    }

    // Tax optimization hint
    if (systemState.usage.daysSinceSignup > 365 && systemState.dataCompleteness.invoices > 100) {
      hints.push({
        id: 'tax_optimization_review',
        title: 'Steueroptimierung prüfen',
        description: 'Mit einem Jahr Daten lohnt sich eine Überprüfung deiner Steuerstrategie.',
        actionPage: 'TaxManagement',
        actionLabel: 'Review starten',
        priority: 6
      });
    }

    hints.sort((a, b) => b.priority - a.priority);

    return Response.json({ hints: hints.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
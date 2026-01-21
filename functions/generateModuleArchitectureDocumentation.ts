import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all entity schemas
    const entitySchemas = {};
    const entityNames = [
      'Building', 'Unit', 'Tenant', 'LeaseContract', 'Invoice', 'Task',
      'BankAccount', 'BankTransaction', 'Payment', 'Document', 'Notification',
      'OperatingCostStatement', 'OperatingCostItem', 'AnlageV', 'AnlageVEinnahmen', 
      'AnlageVWerbungskosten', 'GeneratedDocument', 'SubscriptionPlan', 'UserSubscription',
      'Lead', 'CalculationHistory', 'QuizResult', 'VPIIndex', 'InsurancePolicy',
      'TenantMessage', 'HandoverProtocol', 'RentIncreaseProposal', 'AuditLog',
      'ElsterSubmission', 'AIHelpContent', 'AITipRule', 'AIConversation', 'AIDocTemplate'
    ];

    for (const entityName of entityNames) {
      try {
        const schema = await base44.asServiceRole.entities[entityName].schema();
        entitySchemas[entityName] = schema;
      } catch (error) {
        entitySchemas[entityName] = { error: 'Schema nicht verfügbar' };
      }
    }

    // Module structure
    const modules = {
      core: {
        name: 'Core Modul',
        description: 'Grundlegende Verwaltungsfunktionen',
        entities: ['Building', 'Unit', 'Tenant', 'LeaseContract'],
        features: [
          'Objektverwaltung',
          'Einheiten-Management',
          'Mieterverwaltung',
          'Vertragsverwaltung'
        ]
      },
      financial: {
        name: 'Finanzmodul',
        description: 'Finanzielle Verwaltung und Banking',
        entities: ['Invoice', 'Payment', 'BankAccount', 'BankTransaction'],
        features: [
          'Rechnungsverwaltung',
          'Zahlungsverfolgung',
          'Banking-Integration',
          'Cashflow-Übersicht'
        ]
      },
      operatingCosts: {
        name: 'Betriebskosten-Modul',
        description: 'Nebenkostenabrechnungen nach BetrKV',
        entities: ['OperatingCostStatement', 'OperatingCostItem'],
        features: [
          'BK-Abrechnung erstellen',
          'Verteilerschlüssel',
          'Automatische Berechnung',
          'PDF-Export'
        ]
      },
      tax: {
        name: 'Steuer-Modul',
        description: 'Anlage V und ELSTER-Integration',
        entities: ['AnlageV', 'AnlageVEinnahmen', 'AnlageVWerbungskosten', 'ElsterSubmission'],
        features: [
          'Anlage V Generierung',
          'ELSTER-Export',
          'AfA-Kalkulation',
          'Werbungskosten-Tracking'
        ]
      },
      documents: {
        name: 'Dokumenten-Modul',
        description: 'Dokumentenverwaltung und -generierung',
        entities: ['Document', 'GeneratedDocument', 'DocumentTemplate'],
        features: [
          'Dokumenten-Bibliothek',
          'Automatische Generierung',
          'Vorlagen-System',
          'Versionshistorie'
        ]
      },
      communication: {
        name: 'Kommunikations-Modul',
        description: 'Mieter-Kommunikation',
        entities: ['TenantMessage', 'Notification'],
        features: [
          'Mieter-Portal',
          'Nachrichten-System',
          'E-Mail-Automation',
          'Benachrichtigungen'
        ]
      },
      tasks: {
        name: 'Aufgaben-Modul',
        description: 'Aufgaben- und Workflow-Management',
        entities: ['Task'],
        features: [
          'Aufgabenverwaltung',
          'Erinnerungen',
          'Workflows',
          'Kalender-Integration'
        ]
      },
      insurance: {
        name: 'Versicherungs-Modul',
        description: 'Versicherungsverwaltung',
        entities: ['InsurancePolicy'],
        features: [
          'Policen-Verwaltung',
          'Fristenüberwachung',
          'Umlagefähigkeit'
        ]
      },
      tenantPortal: {
        name: 'Mieter-Portal',
        description: 'Self-Service für Mieter',
        entities: ['TenantMessage', 'HandoverProtocol'],
        features: [
          'Dokumentenzugriff',
          'Schadensmeldung',
          'Zahlungsübersicht',
          'Kommunikation'
        ]
      },
      ai: {
        name: 'KI-Modul',
        description: 'KI-gestützte Funktionen',
        entities: ['AIHelpContent', 'AITipRule', 'AIConversation', 'AIDocTemplate'],
        features: [
          'Kontextuelle Hilfe',
          'Intelligente Tipps',
          'KI-Chat',
          'Dokumenten-Vorschläge'
        ]
      },
      leadManagement: {
        name: 'Lead-Management',
        description: 'Marketing und Lead-Erfassung',
        entities: ['Lead', 'CalculationHistory', 'QuizResult'],
        features: [
          'Lead-Capture',
          'Scoring',
          'Rechner-Historie',
          'Quiz-Auswertung'
        ]
      },
      subscription: {
        name: 'Subscription-Modul',
        description: 'Abonnement-Verwaltung',
        entities: ['SubscriptionPlan', 'UserSubscription'],
        features: [
          'Plan-Management',
          'Billing',
          'Limits',
          'Upgrades'
        ]
      }
    };

    // Backend Functions Overview
    const backendFunctions = {
      core: ['generateDashboardStats', 'globalSearch', 'logActivity'],
      financial: ['sendPaymentReminder'],
      lead: ['captureLead', 'convertLeadToUser', 'updateLeadScore', 'trackCalculation'],
      calculators: ['calculateRendite', 'calculateIndexmiete', 'fetchVpiIndex'],
      documents: ['generatePdf', 'sendLetterXpress'],
      quiz: ['processQuizResult'],
      tax: ['seedVPIData'],
      tasks: ['createTaskFromEntity'],
      communication: ['sendWelcomeEmail']
    };

    // Frontend Structure
    const frontend = {
      pages: {
        dashboards: ['VermieterDashboard', 'MieterDashboard', 'StBDashboard', 'Dashboard'],
        buildings: ['Buildings', 'BuildingDetail', 'BuildingDetailEnhanced'],
        tenants: ['Tenants', 'TenantDetail', 'TenantDetailEnhanced'],
        contracts: ['Contracts', 'ContractDetail', 'ContractDetailEnhanced'],
        units: ['UnitsManagement', 'UnitDetail', 'UnitDetailEnhanced'],
        documents: ['Documents', 'DocumentManagement'],
        financial: ['Payments', 'Invoices', 'BankAccounts', 'BankTransactions'],
        tasks: ['Tasks', 'TaskManagement'],
        calculators: ['RenditeRechner', 'IndexmietenRechner', 'AfACalculator', 'CashflowRechner'],
        wizards: ['BKAbrechnungWizard', 'AnlageVWizard', 'MietvertragGenerator', 'OnboardingWizard'],
        settings: ['SettingsPage', 'SettingsProfile', 'SettingsIntegrations', 'SettingsAppearance'],
        marketing: ['VermitifyHomepage', 'VermitifyPricing', 'VermitifyFeatures', 'VermitifyContact'],
        errors: ['Error404', 'Error500', 'OfflineError', 'MaintenanceMode'],
        admin: ['AdminDashboard', 'AdminLeadDashboard', 'AdminUserManagement']
      },
      components: {
        shared: ['VfInput', 'VfSelect', 'VfButton', 'VfModal', 'VfDatePicker', 'VfTextarea', 'VfCheckbox'],
        dashboard: ['StatCard', 'QuickActionsWidget', 'RevenueWidget'],
        buildings: ['BuildingCard', 'BuildingForm', 'BuildingSummary', 'BuildingPhotoGallery'],
        tenants: ['TenantForm', 'TenantScoring', 'DepositManager'],
        contracts: ['ContractForm', 'RentChangeHistory', 'ContractRenewalTracker'],
        notifications: ['NotificationBell', 'NotificationBadge', 'AlertPreferences'],
        activity: ['ActivityTimeline', 'VfActivityFeed']
      }
    };

    // Design System
    const designSystem = {
      themes: ['vermieter', 'mieter', 'b2b', 'komfort', 'invest'],
      colorTokens: ['primary', 'accent', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'],
      components: [
        'vf-btn', 'vf-card', 'vf-input', 'vf-select', 'vf-table', 
        'vf-badge', 'vf-alert', 'vf-toast', 'vf-sidebar', 'vf-navbar'
      ],
      layouts: ['vf-detail-page', 'vf-list-page', 'vf-dashboard', 'vf-wizard', 'vf-settings']
    };

    // Architecture documentation
    const documentation = {
      generated_at: new Date().toISOString(),
      project: 'Vermitify',
      version: '1.0',
      description: 'Intelligente Immobilienverwaltungs-Plattform mit Steueroptimierung',
      
      modules,
      
      entities: {
        total: Object.keys(entitySchemas).length,
        schemas: entitySchemas,
        byModule: Object.keys(modules).reduce((acc, key) => {
          acc[key] = modules[key].entities;
          return acc;
        }, {})
      },
      
      backend: {
        total_functions: Object.values(backendFunctions).reduce((sum, arr) => sum + arr.length, 0),
        functions_by_category: backendFunctions,
        integrations: ['Core', 'Stripe', 'finAPI', 'LetterXpress', 'ELSTER', 'Slack']
      },
      
      frontend,
      
      designSystem,
      
      technicalStack: {
        frontend: ['React', 'Tailwind CSS', 'TypeScript', 'Base44 SDK'],
        backend: ['Deno', 'Base44 Backend-as-a-Service'],
        integrations: ['finAPI', 'LetterXpress', 'Stripe', 'ELSTER', 'Slack'],
        ai: ['Anthropic Claude API']
      },
      
      keyFeatures: [
        'Multi-Objekt-Verwaltung',
        'Automatische Betriebskostenabrechnungen',
        'Anlage V & ELSTER-Integration',
        'Mieter-Portal',
        'Banking-Integration (finAPI)',
        'Dokumenten-Automatisierung',
        'KI-Assistenten',
        'Lead-Management',
        'Multi-Mandanten-Fähigkeit'
      ],
      
      compliance: {
        dsgvo: true,
        betrKV: true,
        mietrecht: true,
        steuerrecht: true
      }
    };

    // Format Markdown Content
    const markdownContent = `# MODUL-ARCHITEKTUR

Generiert am: ${new Date().toISOString()}

## ÜBERSICHT

**Projekt:** ${documentation.project}  
**Version:** ${documentation.version}  
**Beschreibung:** ${documentation.description}

---

## MODULE

${Object.entries(modules).map(([key, module]) => `
### ${module.name}

**Beschreibung:** ${module.description}

**Entities:**
${module.entities.map(e => `- ${e}`).join('\n')}

**Features:**
${module.features.map(f => `- ${f}`).join('\n')}
`).join('\n')}

---

## BACKEND FUNCTIONS

**Gesamt:** ${documentation.backend.total_functions} Funktionen

${Object.entries(backendFunctions).map(([category, functions]) => `
### ${category}
${functions.map(f => `- ${f}`).join('\n')}
`).join('\n')}

---

## FRONTEND STRUKTUR

### Pages
${Object.entries(frontend.pages).map(([category, pages]) => `
**${category}:**
${pages.map(p => `- ${p}`).join('\n')}
`).join('\n')}

### Components
${Object.entries(frontend.components).map(([category, components]) => `
**${category}:**
${components.map(c => `- ${c}`).join('\n')}
`).join('\n')}

---

## DESIGN SYSTEM

**Themes:** ${designSystem.themes.join(', ')}

**Komponenten:** ${designSystem.components.join(', ')}

**Layouts:** ${designSystem.layouts.join(', ')}

---

## TECHNISCHER STACK

**Frontend:** ${documentation.technicalStack.frontend.join(', ')}

**Backend:** ${documentation.technicalStack.backend.join(', ')}

**Integrationen:** ${documentation.technicalStack.integrations.join(', ')}

**KI:** ${documentation.technicalStack.ai.join(', ')}

---

## KEY FEATURES

${documentation.keyFeatures.map(f => `- ${f}`).join('\n')}

---

## COMPLIANCE

- DSGVO: ✅
- BetrKV: ✅
- Mietrecht: ✅
- Steuerrecht: ✅
`;

    return Response.json({ 
      success: true,
      markdownContent,
      documentation 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
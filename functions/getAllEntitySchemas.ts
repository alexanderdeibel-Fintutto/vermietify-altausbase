import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fallback: Bekannte Entity-Schemas aus dem System
const KNOWN_ENTITY_SCHEMAS = {
  "Building": {
    "name": "Building",
    "type": "object",
    "properties": {
      "name": {"type": "string", "description": "Name des Gebäudes"},
      "address": {"type": "string", "description": "Straße des Gebäudes"},
      "city": {"type": "string", "description": "Stadt des Gebäudes"},
      "postal_code": {"type": "string", "description": "Postleitzahl des Gebäudes"},
      "year_built": {"type": "number", "description": "Baujahr"},
      "total_units": {"type": "number", "description": "Anzahl Wohneinheiten"}
    },
    "required": ["name", "address", "city", "postal_code"]
  },
  "Unit": {
    "name": "Unit",
    "type": "object",
    "properties": {
      "gebaeude_id": {"type": "string", "description": "Referenz zum Gebäude"},
      "unit_number": {"type": "string", "description": "Wohnungsnummer"},
      "floor": {"type": "number", "description": "Etage"},
      "rooms": {"type": "number", "description": "Anzahl Zimmer"},
      "sqm": {"type": "number", "description": "Wohnfläche in qm"},
      "status": {"type": "string", "enum": ["occupied", "vacant", "renovation"]}
    },
    "required": ["gebaeude_id", "unit_number", "sqm"]
  },
  "Tenant": {
    "name": "Tenant",
    "type": "object",
    "properties": {
      "first_name": {"type": "string", "description": "Vorname"},
      "last_name": {"type": "string", "description": "Nachname"},
      "email": {"type": "string", "description": "E-Mail-Adresse"},
      "phone": {"type": "string", "description": "Telefonnummer"},
      "date_of_birth": {"type": "string", "format": "date"}
    },
    "required": ["first_name", "last_name"]
  },
  "LeaseContract": {
    "name": "LeaseContract",
    "type": "object",
    "properties": {
      "unit_id": {"type": "string"},
      "tenant_id": {"type": "string"},
      "start_date": {"type": "string", "format": "date"},
      "end_date": {"type": "string", "format": "date"},
      "base_rent": {"type": "number"},
      "total_rent": {"type": "number"},
      "status": {"type": "string", "enum": ["active", "terminated", "expired"]}
    },
    "required": ["unit_id", "tenant_id", "start_date", "base_rent", "total_rent"]
  }
};

Deno.serve(async (req) => {
    const debugLogs = [];
    const logDebug = (msg) => {
        debugLogs.push(msg);
        console.error(msg);
    };

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        logDebug("=== getAllEntitySchemas START ===");
        logDebug(`User: ${user?.email}`);

        const schemas = {};
        
        // Liste aller bekannten Entity-Namen
        const allEntityNames = [
            'Building', 'Unit', 'Owner', 'Shareholder', 'OwnerRelationship', 'Tenant', 'LeaseContract',
            'CoTenant', 'Termination', 'Invoice', 'FinancialItem', 'GeneratedFinancialBooking', 'CostCategory',
            'BankAccount', 'BankTransaction', 'BankStatement', 'BankTransfer', 'TransferDraft', 'PropertyTax',
            'Insurance', 'InsurancePolicy', 'InsuranceContract', 'Financing', 'Supplier', 'SupplierContract',
            'Meter', 'MeterReading', 'MeterReadingSchedule', 'MeterReadingRoute', 'BuildingTaxLibrary',
            'OperatingCostStatement', 'OperatingCostStatementItem', 'OperatingCostItem', 'OperatingCostUnitResult',
            'OperatingCostUnitDetail', 'Document', 'DocumentTemplate', 'DocumentOriginal', 'UploadedDocument',
            'GeneratedDocument', 'TextBlock', 'LetterShipment', 'LetterXpressCredential', 'Task', 'ActivityLog',
            'Notification', 'GeneratedDocumentation', 'BuildingPermission', 'FieldPermission', 'RoleDefinition',
            'Report', 'AuditLog', 'Approval', 'Analytics', 'AlertRule', 'AlertPreference', 'Feature', 'Webhook',
            'APIKey', 'Workflow', 'Product', 'FeatureGroup', 'SavedSearch', 'DocumentInbox', 'ProductFeature',
            'UsageLimit', 'PricingAuditLog', 'PricingSnapshot', 'DocumentVersion', 'ApprovalWorkflow', 'UserFavorite',
            'InvoiceTemplate', 'SubscriptionPlan', 'SubscriptionAddOn', 'Portfolio', 'PlanLimit', 'PlanAddOnPricing',
            'Asset', 'BundleItem', 'UpsellTrigger', 'Bundle', 'Discount', 'AssetTransaction', 'Dividend',
            'UserSubscription', 'AssetValuation', 'TaxOptimization', 'UserLimit', 'Mandant', 'SubscriptionInvoice',
            'UsageLog', 'UserAddOn', 'StakingReward', 'OtherAsset', 'Crypto', 'PreciousMetal', 'FreistellungsauftragBank',
            'Stock', 'CommunicationWorkflow', 'RentIndex', 'UserTaxSettings', 'CommunicationLog', 'EnergyPassport',
            'UserMandantAccess', 'PurchaseContract', 'AfaSchedule', 'RentChange', 'ActualPayment', 'EmergencyContact',
            'PlannedBooking', 'TaxReturnVLine', 'PropertyTaxDecree', 'ContractTermination', 'TaxReturnV', 'BuildingOwnership',
            'ElsterSubmission', 'ElsterCertificate', 'AnlageVSubmission', 'AnlageKAP', 'TaxReturn', 'ElsterResponse',
            'AnlageSO', 'AnlageVorsorgeaufwand', 'EstMantelbogen', 'AnlageG', 'ElsterLog', 'TaxFormAttachment',
            'ElsterSettings', 'TaxEvent', 'TaxOptimizationScenario', 'TaxSummary', 'TaxLot', 'TaxSettings',
            'TaxHarvestingSuggestion', 'PortfolioAlert', 'PortfolioNotification', 'AssetApiConfig', 'AssetPrice',
            'AssetHolding', 'PortfolioAccount', 'TenantNotification', 'TenantMessage', 'CommunityPost', 'Viewing',
            'MaintenanceTask', 'FieldTask', 'BuildingInspection', 'InspectionChecklist', 'InspectionFinding',
            'CommunityComment', 'SurveyResponse', 'TenantSurvey', 'Announcement', 'ServiceRating', 'ARViewing',
            'TenantAppSession', 'TenantFavorite', 'SmartDevice', 'RentOptimization', 'IncomeVariance', 'DigitalKey',
            'ServiceProvider', 'PropertyROI', 'MaintenancePrediction', 'ComplianceCheck', 'PaymentReminder',
            'HeritageProtection', 'PortfolioMetrics', 'SmartContract', 'IndustryBenchmark', 'IndexRentAdjustment',
            'ContractRenewal', 'RentIncrease', 'PropertyBudget', 'Deposit', 'Applicant', 'HandoverProtocol',
            'UtilitySettlement', 'LoanPayment', 'SEPAMandate', 'Reserve', 'MaintenanceRoute', 'Vacancy', 'RentDebt',
            'SignatureRequest', 'DLPViolation', 'DocumentRights', 'DLPRule', 'DocumentLock', 'DocumentEncryption',
            'TenantAccessControl', 'DashboardConfig', 'CustomMetadataField', 'DocumentExpiry', 'DocumentCollaborationSession',
            'DocumentClassificationRule', 'DocumentRetentionPolicy', 'ComplianceReport', 'WorkflowExecution',
            'WorkflowComment', 'WorkflowCollaborationSession', 'WorkflowCondition', 'WorkflowRoleAssignment',
            'WorkflowTrigger', 'WorkflowRole', 'WorkflowIntegration', 'ReportSchedule', 'WorkflowTemplate',
            'WorkflowPermission', 'UserGroup', 'WorkflowVersion', 'CustomRole', 'PermissionAuditLog', 'UserPreferences',
            'WorkflowAutomation', 'UserRoleAssignment', 'UserRole', 'DocumentWorkflowRule', 'DocumentTask',
            'DocumentWorkflow', 'DocumentArchive', 'DocumentAnalytics', 'Company', 'KnowledgeBaseArticle',
            'DashboardTemplate', 'WidgetInteraction', 'TenantOnboarding', 'DocumentAnalysis', 'Budget', 'MessageThread',
            'IoTSensor', 'HeatingOptimization', 'TenantIssueReport', 'EnergyAnalysis', 'SensorReading', 'BuildingTask',
            'Vendor', 'VendorRating', 'VendorTask', 'BuildingManager', 'VendorDocument', 'NotificationPreference',
            'BuildingBoardComment', 'BuildingBoardPost', 'DocumentSignature', 'SupportTicket', 'CommunicationTemplate',
            'OnboardingWorkflow', 'BudgetRequest', 'OnboardingAuditLog', 'TenantFeedback', 'RollingBudget',
            'TenantAdministrationLock', 'ExpenseReport', 'CostOptimizationAnalysis', 'BudgetScenario', 'DepartmentMember',
            'Department', 'UserPermission', 'UserAuditLog', 'FinAPISync', 'ReportConfig', 'FinancialReport', 'SyncJob',
            'SyncAuditLog', 'TaxLawUpdate', 'TaxConfig', 'TaxRuleCategory', 'TaxRule', 'TaxRuleAuditLog',
            'OnboardingScenario', 'TaxProfile', 'CrossBorderTransaction', 'CryptoHolding', 'DashboardWidget',
            'IMAPAccount', 'Template', 'OtherIncomeCH', 'TaxDeadline', 'TaxLossCarryforward', 'TaxAuditFile',
            'TaxReminder', 'TaxCalculation', 'TaxCompliance', 'TaxScenario', 'TaxAlert', 'TaxDocument', 'TaxPlanning',
            'TaxFiling', 'CapitalGainCH', 'PriceHistory', 'PortfolioShare', 'CantonConfig', 'AutomationConfig',
            'OtherIncomeAT', 'InvestmentAT', 'InvestmentCH', 'CapitalGainAT', 'RealEstateCH', 'PortfolioComment',
            'ComplianceAudit', 'AIRecommendation', 'Investment', 'TeamActivityLog', 'CapitalGain', 'OwnerAssetLink',
            'AdvisorPortal', 'OtherIncome', 'AssetPortfolio', 'ScenarioSimulation', 'PortfolioBenchmark',
            'RebalancingStrategy', 'AssetPerformanceHistory', 'ImportBatchLog', 'ImportMapping', 'CostCenter',
            'BudgetAlert', 'CashflowForecast', 'TenantCommunication', 'Equipment', 'UserOnboarding', 'TesterAnalytics',
            'UserJourney', 'ArchivedInsights', 'AIInsight', 'UserSegment', 'ProblemSummary', 'CleanupLog', 'TestPhase',
            'UXPattern', 'Theme', 'TestAssignment', 'TestSession', 'TesterInvitation', 'TestAccount', 'TesterActivity',
            'NavigationState', 'FeatureUnlock', 'UserPackageConfiguration', 'PackageTemplate', 'LegalKnowledgeBase',
            'LegalUpdateMonitor', 'KnowledgeGap', 'ClaudeAnalysisReport', 'TaxCategoryMaster', 'ElsterFormTemplate',
            'UserProblem', 'TesterCommunication', 'ProblemReportSummary', 'UserPackageConfig', 'OnboardingProgress',
            'EmailTemplate', 'ModulePricing', 'Role', 'ModuleAccess', 'Permission', 'UserActivity', 'UserSuiteSubscription',
            'ModuleDefinition', 'UserModuleAccess', 'AppSuite', 'ProjectFeature', 'WhatsAppOptIn', 'WhatsAppTemplate',
            'WhatsAppAccount', 'WhatsAppMessage', 'WhatsAppWebhookLog', 'WhatsAppContact', 'ProblemCategory',
            'ProblemStatistics', 'ProblemSolution', 'DocumentationChange', 'TaskPriority', 'Email', 'Automation',
            'WorkflowStep', 'PaymentTransactionLink', 'AfASchedule', 'BookingGenerationRule', 'Recipient',
            'TaxForm', 'TaxFormField', 'TaskStatus', 'Payment', 'CategorizationRule', 'FinancialItemTransactionLink',
            'EuerCategory', 'CostType', 'Gebaeude', 'TaxCategory', 'CostTaxLink', 'CustomCostCategory'
        ];

        logDebug(`Versuche ${allEntityNames.length} Entity-Schemas zu laden...`);

        // Lese Entity-Schemas direkt aus dem Dateisystem
        const entityFilesPath = '/var/task/entities';
        
        try {
            // Versuche Dateisystem-Zugriff (falls verfügbar)
            for await (const dirEntry of Deno.readDir(entityFilesPath)) {
                if (dirEntry.isFile && dirEntry.name.endsWith('.json')) {
                    try {
                        const entityName = dirEntry.name.replace('.json', '');
                        const filePath = `${entityFilesPath}/${dirEntry.name}`;
                        const fileContent = await Deno.readTextFile(filePath);
                        const schema = JSON.parse(fileContent);
                        
                        if (schema && schema.properties) {
                            schemas[entityName] = schema;
                            logDebug(`✓ ${entityName}: ${Object.keys(schema.properties).length} Felder (aus Datei)`);
                        }
                    } catch (error) {
                        logDebug(`✗ ${dirEntry.name}: Fehler beim Laden - ${error.message}`);
                    }
                }
            }
        } catch (fsError) {
            logDebug(`Dateisystem-Zugriff nicht möglich: ${fsError.message}`);
            logDebug(`Fallback zu KNOWN_ENTITY_SCHEMAS`);
            
            // Fallback zu den bekannten Schemas
            Object.assign(schemas, KNOWN_ENTITY_SCHEMAS);
        }

        logDebug(`Schemas geladen: ${Object.keys(schemas).length}`);
        logDebug(`\n=== FINAL RESULT ===`);
        logDebug(`Total schemas found: ${Object.keys(schemas).length}`);
        logDebug(`Schema names: ${Object.keys(schemas).slice(0, 10).join(', ')}...`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs,
            note: `Geladen: ${Object.keys(schemas).length} Entity-Schemas`
        });

    } catch (error) {
        debugLogs.push(`Error: ${error.message}`);
        console.error('Error:', error);
        return Response.json({
            error: error.message,
            debugLogs
        }, { status: 500 });
    }
});
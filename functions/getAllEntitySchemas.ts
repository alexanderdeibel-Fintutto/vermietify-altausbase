import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
        
        const entityNames = [...new Set([
            'Building', 'Unit', 'Tenant', 'LeaseContract', 'Document', 'Template',
            'PropertyTax', 'Insurance', 'Financing', 'Supplier', 'BankAccount',
            'BankTransaction', 'GeneratedFinancialBooking', 'Invoice', 'CostCategory',
            'Task', 'Email', 'LetterXpressCredential', 'LetterShipment',
            'Owner', 'Shareholder', 'OwnerRelationship', 'Payment', 'RentChange',
            'PurchaseContract', 'IMAPAccount', 'Workflow', 'WorkflowStep', 'Automation',
            'ActivityLog', 'Notification', 'TextBlock', 'TaskStatus', 'TaskPriority',
            'TaxForm', 'TaxFormField', 'AnlageVSubmission', 'BuildingTaxLibrary',
            'AfASchedule', 'BookingGenerationRule', 'OperatingCostStatement',
            'OperatingCostStatementItem', 'Recipient', 'FinancialItem',
            'CategorizationRule', 'PaymentTransactionLink', 'FinancialItemTransactionLink',
            'EuerCategory', 'TaxCategory', 'CostTaxLink', 'CustomCostCategory', 'CostType',
            'Gebaeude', 'Meter', 'DocumentOriginal', 'GeneratedDocumentation',
            'DocumentationChange', 'UserProblem', 'ProblemCategory', 'ProblemSolution',
            'ProblemStatistics', 'ProjectFeature', 'TenantNotification', 'TenantMessage', 'DocumentTemplate', 
            'CommunityPost', 'Viewing', 'MaintenanceTask', 'Termination', 'GeneratedDocument', 
            'FieldTask', 'BuildingInspection', 'InspectionChecklist', 'InspectionFinding', 'CommunityComment',
            'SurveyResponse', 'TenantSurvey', 'Announcement', 'ServiceRating', 'ARViewing', 'TenantAppSession', 'TenantFavorite', 'SmartDevice', 'RentOptimization', 'IncomeVariance', 'DigitalKey', 'ServiceProvider', 'PropertyROI', 'MaintenancePrediction', 'ComplianceCheck', 'PaymentReminder', 'HeritageProtection', 'PortfolioMetrics', 'SmartContract', 'IndustryBenchmark', 'EnergyPassport', 'IndexRentAdjustment', 'ContractRenewal', 'RentIncrease', 'PropertyBudget', 'Deposit', 'Applicant', 'HandoverProtocol', 'UtilitySettlement', 'LoanPayment', 'SEPAMandate', 'Reserve', 'MaintenanceRoute', 'Vacancy', 'RentDebt', 'SignatureRequest', 'DocumentVersion', 'DLPViolation', 'DocumentRights', 'DLPRule', 'DocumentLock', 'DocumentEncryption', 'TenantAccessControl', 'DashboardConfig', 'CustomMetadataField', 'DocumentComment', 'DocumentRelationship', 'DocumentExpiry', 'DocumentCollaborationSession', 'DocumentPermission', 'Webhook', 'DocumentClassificationRule', 'DocumentRetentionPolicy', 'ComplianceReport', 'WorkflowExecution', 'WorkflowComment', 'WorkflowCollaborationSession', 'WorkflowCondition', 'WorkflowRoleAssignment', 'WorkflowTrigger', 'WorkflowRole', 'WorkflowIntegration', 'ReportSchedule', 'WorkflowTemplate', 'WorkflowPermission', 'UserGroup', 'WorkflowVersion', 'AuditLog', 'CustomRole', 'PermissionAuditLog', 'UserPreferences', 'WorkflowAutomation', 'UserRoleAssignment', 'UserRole', 'DocumentWorkflowRule', 'DocumentTask', 'DocumentWorkflow', 'DocumentArchive', 'DocumentAnalytics', 'Company', 'KnowledgeBaseArticle', 'DashboardTemplate', 'WidgetInteraction', 'TenantOnboarding', 'DocumentAnalysis', 'Budget', 'MessageThread', 'IoTSensor', 'HeatingOptimization', 'TenantIssueReport', 'EnergyAnalysis', 'SensorReading', 'BuildingTask', 'SavedSearch', 'MeterReading', 'MeterReadingSchedule', 'MeterReadingRoute', 'Vendor', 'VendorRating', 'VendorTask', 'BuildingManager', 'VendorDocument', 'NotificationPreference', 'BuildingBoardComment', 'BuildingBoardPost', 'DocumentSignature', 'SupportTicket', 'CommunicationTemplate', 'OnboardingWorkflow', 'ApprovalWorkflow', 'BudgetRequest', 'OnboardingAuditLog', 'TenantFeedback', 'RollingBudget', 'TenantAdministrationLock', 'ExpenseReport', 'CostOptimizationAnalysis', 'BudgetScenario', 'DepartmentMember', 'Department', 'UserPermission', 'UserAuditLog', 'FinAPISync', 'ReportConfig', 'FinancialReport', 'SyncJob', 'SyncAuditLog', 'ElsterSubmission', 'TaxLawUpdate', 'TaxConfig', 'TaxRuleCategory', 'TaxRule', 'TaxRuleAuditLog', 'OnboardingScenario', 'TaxProfile', 'CrossBorderTransaction', 'CryptoHolding', 'DashboardWidget', 'DocumentInbox', 'OtherIncomeCH', 'TaxDeadline', 'TaxLossCarryforward', 'TaxAuditFile', 'TaxReminder', 'TaxCalculation', 'TaxCompliance', 'TaxScenario', 'TaxAlert', 'TaxDocument', 'TaxPlanning', 'TaxFiling', 'CapitalGainCH', 'PriceHistory', 'PortfolioShare', 'CantonConfig', 'PortfolioAlert', 'AutomationConfig', 'OtherIncomeAT', 'InvestmentAT', 'InvestmentCH', 'CapitalGainAT', 'RealEstateCH', 'PortfolioComment', 'ComplianceAudit', 'AIRecommendation', 'Investment', 'TeamActivityLog', 'CapitalGain', 'OwnerAssetLink', 'AdvisorPortal', 'OtherIncome', 'AssetPortfolio', 'ScenarioSimulation', 'PortfolioBenchmark', 'PortfolioNotification', 'RebalancingStrategy', 'AssetPerformanceHistory', 'ImportBatchLog', 'ImportMapping', 'FinancialItem', 'CostCenter', 'BudgetAlert', 'CashflowForecast', 'TenantCommunication', 'Equipment', 'UserOnboarding', 'TesterAnalytics', 'UserJourney', 'ArchivedInsights', 'AIInsight', 'UserSegment', 'ProblemSummary', 'CleanupLog', 'TestPhase', 'UXPattern', 'Theme', 'TestAssignment', 'TestSession', 'TesterInvitation', 'TestAccount', 'TesterActivity', 'NavigationState', 'FeatureUnlock', 'UserPackageConfiguration', 'PackageTemplate', 'LegalKnowledgeBase', 'LegalUpdateMonitor', 'KnowledgeGap', 'ClaudeAnalysisReport', 'TaxCategoryMaster', 'ElsterCertificate', 'ElsterFormTemplate', 'ProblemReportSummary', 'UserPackageConfig', 'OnboardingProgress', 'EmailTemplate', 'APIKey', 'ModulePricing', 'FieldPermission', 'Role', 'ModuleAccess', 'Permission', 'UserActivity', 'UserSuiteSubscription', 'ModuleDefinition', 'UserModuleAccess', 'AppSuite', 'WhatsAppOptIn', 'WhatsAppTemplate', 'WhatsAppAccount', 'WhatsAppMessage', 'WhatsAppWebhookLog', 'WhatsAppContact'
        ])];

        const schemas = {};
        
        logDebug(`Anzahl Entity-Namen: ${entityNames.length}`);
        logDebug(`Erste 3 Entity-Namen: ${entityNames.slice(0, 3).join(', ')}`);

        for (const name of entityNames) {
            if (!name) continue;
            try {
                const schema = await base44.entities.schema(name);
                if (schema) {
                  schemas[name] = { name, ...schema };
                }
            } catch (error) {
                // Silent catch
            }
        }
        
        logDebug(`\n=== FINAL RESULT ===`);
        logDebug(`Total schemas found: ${Object.keys(schemas).length}`);
        logDebug(`Schema names: ${Object.keys(schemas).slice(0, 5).join(', ')}...`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs
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
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Upload, CheckCircle, AlertCircle, 
  Sparkles, Settings, TrendingUp, Download, Archive, TestTube, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TaxFormWizard from '@/components/elster/TaxFormWizard';
import CertificateUploadDialog from '@/components/elster/CertificateUploadDialog';
import ElsterAnalytics from '@/components/elster/ElsterAnalytics';
import ElsterSetupWizard from '@/components/elster/ElsterSetupWizard';
import BulkFormExport from '@/components/elster/BulkFormExport';
import BulkExportButton from '@/components/elster/BulkExportButton';
import SubmissionDetailDialog from '@/components/elster/SubmissionDetailDialog';
import GoBDComplianceDashboard from '@/components/elster/GoBDComplianceDashboard';
import SubmissionTimeline from '@/components/elster/SubmissionTimeline';
import FormTemplateManager from '@/components/elster/FormTemplateManager';
import BatchOperationsPanel from '@/components/elster/BatchOperationsPanel';
import CategoryImportDialog from '@/components/elster/CategoryImportDialog';
import QuickActionsCard from '@/components/elster/QuickActionsCard';
import SubmissionStatsCard from '@/components/elster/SubmissionStatsCard';
import SubmissionHistory from '@/components/elster/SubmissionHistory';
import DeadlineReminder from '@/components/elster/DeadlineReminder';
import FormComparisonView from '@/components/elster/FormComparisonView';
import CertificateTestDialog from '@/components/elster/CertificateTestDialog';
import AuditTrailCard from '@/components/elster/AuditTrailCard';
import BulkExportDialog from '@/components/elster/BulkExportDialog';
import ExcelImportDialog from '@/components/elster/ExcelImportDialog';
import MultiYearComparison from '@/components/elster/MultiYearComparison';
import ValidationPreview from '@/components/elster/ValidationPreview';
import PDFPreviewDialog from '@/components/elster/PDFPreviewDialog';
import SubmissionComparisonDialog from '@/components/elster/SubmissionComparisonDialog';
import DeadlineTracker from '@/components/elster/DeadlineTracker';
import QuickDuplicateButton from '@/components/elster/QuickDuplicateButton';
import BulkActionsPanel from '@/components/elster/BulkActionsPanel';
import TemplateEditor from '@/components/elster/TemplateEditor';
import ComplianceDashboard from '@/components/elster/ComplianceDashboard';
import StatusChangeDialog from '@/components/elster/StatusChangeDialog';
import XMLPreview from '@/components/elster/XMLPreview';
import CertificateRenewalReminder from '@/components/elster/CertificateRenewalReminder';
import SystemHealthCheck from '@/components/elster/SystemHealthCheck';
import TaxAdvisorReport from '@/components/elster/TaxAdvisorReport';
import FinancialDataSync from '@/components/elster/FinancialDataSync';
import VersionHistory from '@/components/elster/VersionHistory';
import ExportOptionsDialog from '@/components/elster/ExportOptionsDialog';
import TaxCalendar from '@/components/elster/TaxCalendar';
import OptimizationAssistant from '@/components/elster/OptimizationAssistant';
import PlausibilityCheck from '@/components/elster/PlausibilityCheck';
import SmartPreFillDialog from '@/components/elster/SmartPreFillDialog';
import SubmissionSearchDialog from '@/components/elster/SubmissionSearchDialog';
import BatchStatusUpdateDialog from '@/components/elster/BatchStatusUpdateDialog';
import QuickActionsMenu from '@/components/elster/QuickActionsMenu';
import YearEndSummary from '@/components/elster/YearEndSummary';
import BatchCreateDialog from '@/components/elster/BatchCreateDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';
import AdvancedBatchValidation from '@/components/elster/AdvancedBatchValidation';
import EnhancedSmartCorrection from '@/components/elster/EnhancedSmartCorrection';
import AutomatedFinancialSync from '@/components/elster/AutomatedFinancialSync';
import ComprehensiveTaxCalendar from '@/components/elster/ComprehensiveTaxCalendar';
import TaxReportingHub from '@/components/elster/TaxReportingHub';
import AutomatedFormGeneration from '@/components/elster/AutomatedFormGeneration';
import ElsterNotificationCenter from '@/components/elster/ElsterNotificationCenter';
import PredictiveTaxAnalytics from '@/components/elster/PredictiveTaxAnalytics';
import CollaborationCenter from '@/components/elster/CollaborationCenter';
import AdvancedExportImport from '@/components/elster/AdvancedExportImport';
import TaxPlanningAssistant from '@/components/elster/TaxPlanningAssistant';
import HistoricalComparison from '@/components/elster/HistoricalComparison';
import MobileOptimizedView from '@/components/elster/MobileOptimizedView';
import QuickInsights from '@/components/elster/QuickInsights';
import IntelligentFormSuggestion from '@/components/elster/IntelligentFormSuggestion';
import MultiMandateManager from '@/components/elster/MultiMandateManager';
import AdvancedDiagnostics from '@/components/elster/AdvancedDiagnostics';
import ComplianceMonitoring from '@/components/elster/ComplianceMonitoring';
import PerformanceOptimizer from '@/components/elster/PerformanceOptimizer';
import SmartDocumentExtraction from '@/components/elster/SmartDocumentExtraction';
import CrossFormValidation from '@/components/elster/CrossFormValidation';
import DataQualityDashboard from '@/components/elster/DataQualityDashboard';
import AutomatedTestingSuite from '@/components/elster/AutomatedTestingSuite';
import RealTimeStatusMonitor from '@/components/elster/RealTimeStatusMonitor';
import SmartAlertSystem from '@/components/elster/SmartAlertSystem';
import AuditReportGenerator from '@/components/elster/AuditReportGenerator';
import TaxScenarioSimulator from '@/components/elster/TaxScenarioSimulator';
import AutomatedBackupSystem from '@/components/elster/AutomatedBackupSystem';
import IntegrationHealthMonitor from '@/components/elster/IntegrationHealthMonitor';
import WorkflowAutomationEngine from '@/components/elster/WorkflowAutomationEngine';
import AITaxAdvisorChat from '@/components/elster/AITaxAdvisorChat';
import AdvancedReportingDashboard from '@/components/elster/AdvancedReportingDashboard';
import MultiYearTaxStrategy from '@/components/elster/MultiYearTaxStrategy';
import RiskManagementSystem from '@/components/elster/RiskManagementSystem';
import TaxLawUpdatesMonitor from '@/components/elster/TaxLawUpdatesMonitor';
import WhiteLabelBranding from '@/components/elster/WhiteLabelBranding';
import CostBenefitCalculator from '@/components/elster/CostBenefitCalculator';
import APIDocumentationGenerator from '@/components/elster/APIDocumentationGenerator';
import AutomatedWorkflowBuilder from '@/components/elster/AutomatedWorkflowBuilder';
import TaxPredictionCard from '@/components/elster/TaxPredictionCard';
import AdvancedReportGenerator from '@/components/elster/AdvancedReportGenerator';
import ComplianceAuditReport from '@/components/elster/ComplianceAuditReport';
import TrendAnalysisDashboard from '@/components/elster/TrendAnalysisDashboard';
import SmartNotificationCenter from '@/components/elster/SmartNotificationCenter';
import SmartInsightsDashboard from '@/components/elster/SmartInsightsDashboard';
import ExportManager from '@/components/elster/ExportManager';
import BulkOperationsManager from '@/components/elster/BulkOperationsManager';
import TemplateLibrary from '@/components/elster/TemplateLibrary';
import AutomationScheduler from '@/components/elster/AutomationScheduler';
import ComplianceTimeline from '@/components/elster/ComplianceTimeline';
import FieldUsageAnalyzer from '@/components/elster/FieldUsageAnalyzer';
import ErrorClusterAnalysis from '@/components/elster/ErrorClusterAnalysis';
import CostStructureAnalyzer from '@/components/elster/CostStructureAnalyzer';
import TaxForecastWidget from '@/components/elster/TaxForecastWidget';
import BatchPDFGenerator from '@/components/elster/BatchPDFGenerator';
import YearComparisonReport from '@/components/elster/YearComparisonReport';
import DataQualityScore from '@/components/elster/DataQualityScore';
import SmartFormSuggestions from '@/components/elster/SmartFormSuggestions';
import SystemHealthCard from '@/components/elster/SystemHealthCard';
import BulkValidationTool from '@/components/elster/BulkValidationTool';
import DataCleanupTool from '@/components/elster/DataCleanupTool';
import AdvancedValidationPanel from '@/components/elster/AdvancedValidationPanel';
import QualityMonitorWidget from '@/components/elster/QualityMonitorWidget';
import ExecutiveDashboard from '@/components/elster/ExecutiveDashboard';
import TaxStrategyAdvisor from '@/components/elster/TaxStrategyAdvisor';
import MultiBuildingOperations from '@/components/elster/MultiBuildingOperations';
import AIErrorCorrectionPanel from '@/components/elster/AIErrorCorrectionPanel';
import ComplianceScoreCard from '@/components/elster/ComplianceScoreCard';
import SubmissionQueueManager from '@/components/elster/SubmissionQueueManager';
import TestingDashboard from '@/components/elster/TestingDashboard';
import ROIDashboard from '@/components/elster/ROIDashboard';
import AdvancedFilterPanel from '@/components/elster/AdvancedFilterPanel';
import BulkPDFExportPanel from '@/components/elster/BulkPDFExportPanel';

export default function ElsterIntegration() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showCategoryImport, setShowCategoryImport] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [testingCertificate, setTestingCertificate] = useState(null);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [comparisonSubmissions, setComparisonSubmissions] = useState({ sub1: null, sub2: null });
  const [selectedForBulk, setSelectedForBulk] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showBatchStatusDialog, setShowBatchStatusDialog] = useState(false);
  const [showBatchCreateDialog, setShowBatchCreateDialog] = useState(false);
  const [showSmartCorrection, setShowSmartCorrection] = useState(false);
  const [correctionSubmission, setCorrectionSubmission] = useState(null);
  const queryClient = useQueryClient();

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create':
        setShowWizard(true);
        break;
      case 'search':
        setShowSearchDialog(true);
        break;
      case 'upload-cert':
        setShowCertUpload(true);
        break;
      case 'bulk-export':
        setShowBulkExport(true);
        break;
      default:
        break;
    }
  };

  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date')
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['elster-certificates'],
    queryFn: () => base44.entities.ElsterCertificate.list()
  });

  const stats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
    avgConfidence: submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / submissions.length)
      : 0,
    activeCertificates: certificates.filter(c => c.is_active).length
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            🏛️ ELSTER-Integration
          </h1>
          <p className="text-slate-600 mt-1">
            Automatische Steuerformular-Erstellung und Übermittlung mit KI-Unterstützung
          </p>
        </div>
        <div className="flex gap-2">
          <BulkExportButton submissions={submissions} />
          <QuickActionsMenu onAction={handleQuickAction} />
          {certificates.length === 0 && (
            <Button onClick={() => setShowSetupWizard(true)} className="bg-blue-600 hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Einrichtung starten
            </Button>
          )}
        </div>
      </motion.div>

      <QuickInsights />

      <SmartFormSuggestions onCreateForm={(suggestion) => {
        setShowWizard(true);
        toast.info(`Wizard für ${suggestion.form_type} wird geöffnet`);
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-12 text-xs overflow-x-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="create">Erstellen</TabsTrigger>
            <TabsTrigger value="submissions">Übermittlungen</TabsTrigger>
            <TabsTrigger value="validation">Validierung</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="planning">Planung</TabsTrigger>
            <TabsTrigger value="history">Historie</TabsTrigger>
            <TabsTrigger value="certificates">Zertifikate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="space-y-6">
              <AdvancedReportingDashboard submissions={submissions} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ExecutiveDashboard />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RealTimeStatusMonitor />
                    <IntegrationHealthMonitor />
                    <CertificateRenewalReminder 
                      certificates={certificates} 
                      onUploadClick={() => setShowCertUpload(true)} 
                    />
                  </div>
                  <IntelligentFormSuggestion 
                    onCreateForm={(params) => {
                      setShowWizard(true);
                      toast.info('Wizard wird geöffnet mit vorausgefüllten Daten');
                    }}
                  />
                  <TrendAnalysisDashboard />
                </div>
                <div className="space-y-6">
                  <SystemHealthCard />
                  <QualityMonitorWidget />
                  <SubmissionQueueManager />
                  <TaxStrategyAdvisor buildingId={submissions[0]?.building_id} />
                  <SmartNotificationCenter />
                  <SmartInsightsDashboard />
                  <ComplianceTimeline />
                  <AutomationScheduler />
                </div>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden">
                <Card>
                  <CardHeader>
                    <CardTitle>Einreichungen (Mobile)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileOptimizedView 
                      submissions={submissions.slice(0, 10)}
                      onSelectSubmission={setSelectedSubmission}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block">
                <DashboardView submissions={submissions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Neues Steuerformular erstellen</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Wizard starten
                  </Button>
                </CardContent>
              </Card>
              <MultiBuildingOperations />
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SubmissionsView 
                  submissions={submissions} 
                  onSelectSubmission={setSelectedSubmission}
                  onCorrectSubmission={(sub) => {
                    setCorrectionSubmission(sub);
                    setShowSmartCorrection(true);
                  }}
                />
                <SubmissionTimeline submissions={submissions} />
              </div>
              <div className="space-y-6">
                <AdvancedFilterPanel onResults={(filtered) => console.log('Filtered:', filtered)} />
                <BulkPDFExportPanel selectedSubmissions={selectedForBulk} />
                <DataQualityScore />
                <BulkValidationTool selectedSubmissions={selectedForBulk} />
                <ExportManager selectedSubmissions={selectedForBulk} />
                <BatchPDFGenerator selectedSubmissions={selectedForBulk} />
                <BulkOperationsManager 
                  selectedSubmissions={selectedForBulk}
                  onComplete={() => queryClient.invalidateQueries({ queryKey: ['elster-submissions'] })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AdvancedBatchValidation 
                    submissions={submissions}
                    onOpenDetail={(submissionId) => {
                      const sub = submissions.find(s => s.id === submissionId);
                      if (sub) setSelectedSubmission(sub);
                    }}
                  />
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Intelligente Fehlerkorrektur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Wählen Sie eine Einreichung mit Fehlern aus, um KI-basierte Korrekturvorschläge zu erhalten.
                      </p>
                      <div className="space-y-2">
                        {submissions
                          .filter(s => s.validation_errors?.length > 0 || s.validation_warnings?.length > 0)
                          .slice(0, 5)
                          .map(sub => (
                            <Button
                              key={sub.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setCorrectionSubmission(sub);
                                setShowSmartCorrection(true);
                              }}
                            >
                              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                              {sub.tax_form_type} - {sub.tax_year}
                            </Button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  <DataQualityDashboard submissions={submissions} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CrossFormValidation submissions={submissions} />
                <AutomatedTestingSuite submission={submissions[0]} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AutomatedFinancialSync />
                <ComprehensiveTaxCalendar />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AutomatedFormGeneration />
                <ElsterNotificationCenter />
              </div>
              <SmartDocumentExtraction />
            </div>
          </TabsContent>

          <TabsContent value="planning" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MultiYearTaxStrategy />
                <AITaxAdvisorChat />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TaxPlanningAssistant />
                <TaxPredictionCard />
                <ComplianceAuditReport />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WorkflowAutomationEngine />
                <AutomatedWorkflowBuilder />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <HistoricalComparison />
                </div>
                <YearComparisonReport />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubmissionHistory submissions={submissions} />
                <FormComparisonView submissions={submissions} formType="ANLAGE_V" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TemplateEditor />
              </div>
              <TemplateLibrary onSelectTemplate={setSelectedSubmission} />
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="mt-6">
            <CertificatesView 
              certificates={certificates} 
              onUploadClick={() => setShowCertUpload(true)}
              onTestCertificate={setTestingCertificate}
            />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Kostenkategorien</CardTitle>
                    <Button onClick={() => setShowCategoryImport(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      CSV importieren
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              <CategoriesView />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <PredictiveTaxAnalytics />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MultiYearComparison submissions={submissions} formType="ANLAGE_V" />
                </div>
                <div className="space-y-6">
                  <ErrorClusterAnalysis />
                  <TaxForecastWidget />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ElsterAnalytics submissions={submissions} />
                </div>
                <div className="space-y-6">
                  <CostStructureAnalyzer />
                  <FieldUsageAnalyzer />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <ComplianceDashboard year={new Date().getFullYear()} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WhiteLabelBranding />
                    <CostBenefitCalculator />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <APIDocumentationGenerator />
                    <AutomatedBackupSystem />
                  </div>
                  <SystemHealthCheck />
                </div>
                <div className="space-y-6">
                  <TestingDashboard />
                  <ROIDashboard />
                  <DataCleanupTool />
                  <TaxLawUpdatesMonitor />
                  <IntegrationHealthMonitor />
                </div>
              </div>
            </div>
          </TabsContent>
          </Tabs>
      </motion.div>

      {showWizard && (
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TaxFormWizard onComplete={() => {
              setShowWizard(false);
              queryClient.invalidateQueries({ queryKey: ['elster-submissions'] });
            }} />
          </DialogContent>
        </Dialog>
      )}

      <CertificateUploadDialog
        open={showCertUpload}
        onOpenChange={setShowCertUpload}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['elster-certificates'] })}
      />

      {showSetupWizard && (
        <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
          <DialogContent className="max-w-3xl">
            <ElsterSetupWizard onComplete={() => {
              setShowSetupWizard(false);
              queryClient.invalidateQueries();
            }} />
          </DialogContent>
        </Dialog>
      )}

      <SubmissionDetailDialog
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      />

      <CategoryImportDialog
        open={showCategoryImport}
        onOpenChange={setShowCategoryImport}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tax-categories'] })}
      />

      <CertificateTestDialog
        certificate={testingCertificate}
        open={!!testingCertificate}
        onOpenChange={(open) => !open && setTestingCertificate(null)}
        onTestComplete={() => queryClient.invalidateQueries({ queryKey: ['elster-certificates'] })}
      />

      <BulkExportDialog
        submissions={submissions}
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
      />

      <ExcelImportDialog
        open={showExcelImport}
        onOpenChange={setShowExcelImport}
        onImportSuccess={(data) => {
          toast.success('Daten erfolgreich importiert');
          setShowExcelImport(false);
        }}
      />

      <PDFPreviewDialog
        submission={previewSubmission}
        open={!!previewSubmission}
        onOpenChange={(open) => !open && setPreviewSubmission(null)}
      />

      <SubmissionComparisonDialog
        submission1={comparisonSubmissions.sub1}
        submission2={comparisonSubmissions.sub2}
        open={!!(comparisonSubmissions.sub1 && comparisonSubmissions.sub2)}
        onOpenChange={(open) => !open && setComparisonSubmissions({ sub1: null, sub2: null })}
      />

      <ExportOptionsDialog
        submissionIds={selectedForBulk}
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      <SubmissionSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSelect={setSelectedSubmission}
      />

      <BatchStatusUpdateDialog
        submissionIds={selectedForBulk}
        open={showBatchStatusDialog}
        onOpenChange={setShowBatchStatusDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['elster-submissions'] })}
      />

      <BatchCreateDialog
        open={showBatchCreateDialog}
        onOpenChange={setShowBatchCreateDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['elster-submissions'] })}
      />

      <EnhancedSmartCorrection
        submission={correctionSubmission}
        open={showSmartCorrection}
        onOpenChange={setShowSmartCorrection}
        onCorrectionApplied={() => {
          queryClient.invalidateQueries({ queryKey: ['elster-submissions'] });
          setShowSmartCorrection(false);
        }}
      />
      </div>
      );
      }

function DashboardView({ submissions }) {
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Letzte Übermittlungen</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p>Noch keine Übermittlungen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{sub.tax_form_type}</div>
                    <div className="text-sm text-slate-600">
                      Jahr: {sub.tax_year} | {sub.legal_form}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={sub.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                    {sub.ai_confidence_score && (
                      <Badge variant="outline">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {sub.ai_confidence_score}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateFormView() {
  const [step, setStep] = useState(1);
  const [formType, setFormType] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateTaxFormWithAI', {
        building_id: buildingId,
        form_type: formType,
        tax_year: taxYear
      });

      if (response.data.success) {
        toast.success('Formular erfolgreich generiert!');
        setStep(3);
      }
    } catch (error) {
      toast.error('Fehler beim Generieren');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Steuerformular erstellen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Formular-Typ</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANLAGE_V">Anlage V - Vermietung & Verpachtung</SelectItem>
                    <SelectItem value="EUER">EÜR - Einnahmen-Überschuss-Rechnung</SelectItem>
                    <SelectItem value="EST1B">ESt 1B - Personengesellschaften</SelectItem>
                    <SelectItem value="GEWERBESTEUER">Gewerbesteuererklärung</SelectItem>
                    <SelectItem value="UMSATZSTEUER">Umsatzsteuererklärung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Objekt</Label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Objekt wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.address || b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Steuerjahr</Label>
                <Input
                  type="number"
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear()}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!formType || !buildingId || isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isGenerating ? 'Wird generiert...' : 'Mit KI generieren'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionsView({ submissions, onSelectSubmission, onCorrectSubmission }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alle Übermittlungen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {submissions.map(sub => (
            <div 
              key={sub.id} 
              className="p-4 border rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectSubmission(sub)}
                >
                  <div className="font-medium">{sub.tax_form_type}</div>
                  <div className="text-sm text-slate-600">
                    Jahr: {sub.tax_year} | {sub.legal_form}
                  </div>
                  {sub.created_date && (
                    <div className="text-xs text-slate-500 mt-1">
                      Erstellt: {new Date(sub.created_date).toLocaleDateString('de-DE')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(sub.validation_errors?.length > 0 || sub.validation_warnings?.length > 0) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCorrectSubmission(sub)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Korrigieren
                    </Button>
                  )}
                  <Badge variant={sub.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                    {sub.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CertificatesView({ certificates, onUploadClick, onTestCertificate }) {

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>ELSTER-Zertifikate</CardTitle>
          <Button onClick={onUploadClick}>
            <Upload className="w-4 h-4 mr-2" />
            Zertifikat hochladen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>Keine Zertifikate vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map(cert => (
              <div key={cert.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{cert.certificate_name}</div>
                    <div className="text-sm text-slate-600">
                      Typ: {cert.certificate_type} | Steuernummer: {cert.tax_number}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Gültig bis: {new Date(cert.valid_until).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <Badge variant={cert.is_active ? 'default' : 'secondary'}>
                    {cert.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    </div>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTestCertificate(cert)}
                    className="mt-2"
                    >
                    <TestTube className="w-4 h-4 mr-2" />
                    Verbindung testen
                    </Button>
                    </div>
                    ))}
                    </div>
                    )}
                    </CardContent>
                    </Card>
                    );
                    }

function CategoriesView() {
  const { data: categories = [] } = useQuery({
    queryKey: ['tax-categories'],
    queryFn: () => base44.entities.TaxCategoryMaster.list()
  });

  const seedMutation = useMutation({
    mutationFn: () => base44.functions.invoke('seedTaxCategoryMaster', {}),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ['tax-categories'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Steuer-Kategorien Master</CardTitle>
          {categories.length === 0 && (
            <Button onClick={() => seedMutation.mutate()}>
              Master-Daten laden
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-600 mb-4">
          {categories.length} Kategorien geladen
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="p-3 border rounded text-sm">
              <div className="font-medium">{cat.display_name}</div>
              <div className="text-xs text-slate-600">
                {cat.legal_forms.join(', ')} | {cat.tax_treatment}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
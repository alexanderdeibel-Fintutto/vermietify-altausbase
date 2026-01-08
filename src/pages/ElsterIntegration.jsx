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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

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
  const queryClient = useQueryClient();

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
        {certificates.length === 0 && (
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkExport(true)} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Bulk-Export
            </Button>
            <Button onClick={() => setShowSetupWizard(true)} className="bg-blue-600 hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Einrichtung starten
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Übermittlungen", value: stats.total, icon: FileText, color: "blue" },
          { label: "Akzeptiert", value: stats.accepted, icon: CheckCircle, color: "green" },
          { label: "Ø KI-Vertrauen", value: `${stats.avgConfidence}%`, icon: Sparkles, color: "purple" },
          { label: "Zertifikate", value: stats.activeCertificates, icon: Settings, color: "orange" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="create">Erstellen</TabsTrigger>
            <TabsTrigger value="submissions">Übermittlungen</TabsTrigger>
            <TabsTrigger value="certificates">Zertifikate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SystemHealthCheck />
                <CertificateRenewalReminder 
                  certificates={certificates} 
                  onUploadClick={() => setShowCertUpload(true)} 
                />
              </div>
              <DashboardView submissions={submissions} />
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
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
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SubmissionsView 
                  submissions={submissions} 
                  onSelectSubmission={setSelectedSubmission}
                />
                <SubmissionTimeline submissions={submissions} />
              </div>
              <div className="space-y-6">
                <BatchOperationsPanel submissions={submissions} />
                <BulkFormExport submissions={submissions} />
                <GoBDComplianceDashboard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplateEditor />
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MultiYearComparison submissions={submissions} formType="ANLAGE_V" />
                </div>
                <DeadlineTracker submissions={submissions} taxYear={new Date().getFullYear()} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ElsterAnalytics submissions={submissions} />
                </div>
                <div className="space-y-6">
                  <FormComparisonView submissions={submissions} formType="ANLAGE_V" />
                  <SubmissionHistory submissions={submissions} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <ComplianceDashboard year={new Date().getFullYear()} />
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

function SubmissionsView({ submissions, onSelectSubmission }) {
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
              className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onSelectSubmission(sub)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                <Badge variant={sub.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                  {sub.status}
                </Badge>
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
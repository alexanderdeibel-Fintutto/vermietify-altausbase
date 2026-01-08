import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Archive, CheckCircle, AlertTriangle, XCircle, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import QuickDuplicateButton from './QuickDuplicateButton';
import AuditLogViewer from './AuditLogViewer';
import ShareWithAdvisorDialog from './ShareWithAdvisorDialog';
import VersionHistory from './VersionHistory';
import CommentSection from './CommentSection';
import ValidationReport from './ValidationReport';
import ComplianceChecklist from './ComplianceChecklist';
import TaxOptimizationSuggestions from './TaxOptimizationSuggestions';
import RiskAssessment from './RiskAssessment';
import TrendAnalysisChart from './TrendAnalysisChart';
import PreSubmissionCheck from './PreSubmissionCheck';
import CollaborationCenter from './CollaborationCenter';
import AdvancedDiagnostics from './AdvancedDiagnostics';
import IntelligentCleaningTool from './IntelligentCleaningTool';
import AIFormAssistant from './AIFormAssistant';
import AutoCorrectButton from './AutoCorrectButton';
import DuplicateDetector from './DuplicateDetector';

export default function SubmissionDetailDialog({ submission, open, onOpenChange }) {
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  
  if (!submission) return null;

  const handleExport = async () => {
    try {
      const response = await base44.functions.invoke('exportTaxFormPDF', { 
        submission_id: submission.id 
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elster_${submission.tax_form_type}_${submission.tax_year}.pdf`;
      a.click();
      toast.success('PDF exportiert');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    }
  };

  const handleArchive = async () => {
    try {
      await base44.functions.invoke('archiveElsterSubmission', { 
        submission_id: submission.id 
      });
      toast.success('Erfolgreich archiviert (10 Jahre aufbewahrungspflichtig)');
      onOpenChange(false);
    } catch (error) {
      toast.error('Archivierung fehlgeschlagen');
    }
  };

  const statusConfig = {
    DRAFT: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    AI_PROCESSED: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    VALIDATED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    SUBMITTED: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
    ACCEPTED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    ARCHIVED: { icon: Archive, color: 'text-slate-600', bg: 'bg-slate-100' }
  };

  const StatusIcon = statusConfig[submission.status]?.icon || AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{submission.tax_form_type}</DialogTitle>
              <p className="text-slate-600">Steuerjahr {submission.tax_year}</p>
            </div>
            <Badge className={`${statusConfig[submission.status]?.bg} ${statusConfig[submission.status]?.color}`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {submission.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadaten */}
          <Card>
            <CardHeader>
              <CardTitle>Übersicht</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600">Rechtsform</div>
                <div className="font-medium">{submission.legal_form}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Modus</div>
                <div className="font-medium">{submission.submission_mode}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Erstellt</div>
                <div className="font-medium">
                  {submission.created_date && new Date(submission.created_date).toLocaleString('de-DE')}
                </div>
              </div>
              {submission.submission_date && (
                <div>
                  <div className="text-sm text-slate-600">Übermittelt</div>
                  <div className="font-medium">
                    {new Date(submission.submission_date).toLocaleString('de-DE')}
                  </div>
                </div>
              )}
              {submission.transfer_ticket && (
                <div className="col-span-2">
                  <div className="text-sm text-slate-600">Transfer-Ticket</div>
                  <div className="font-mono text-sm">{submission.transfer_ticket}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="data">
            <TabsList className="grid w-full grid-cols-12 text-xs overflow-x-auto">
              <TabsTrigger value="data">Daten</TabsTrigger>
              <TabsTrigger value="validation">Validierung</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnose</TabsTrigger>
              <TabsTrigger value="assistant">KI-Assistent</TabsTrigger>
              <TabsTrigger value="collaboration">Team</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="risk">Risiko</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="optimization">Optimierung</TabsTrigger>
              <TabsTrigger value="precheck">Check</TabsTrigger>
              <TabsTrigger value="xml">XML</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {submission.form_data && Object.keys(submission.form_data).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(submission.form_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b pb-2">
                          <span className="text-sm text-slate-600">{key}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500">Keine Formulardaten</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-4">
              <div className="space-y-4">
                <AdvancedDiagnostics submission={submission} />
                <IntelligentCleaningTool 
                  submissionId={submission.id} 
                  onCleanComplete={() => onOpenChange(false)}
                />
                <DuplicateDetector submissionId={submission.id} />
              </div>
            </TabsContent>

            <TabsContent value="assistant" className="mt-4">
              <AIFormAssistant submissionId={submission.id} />
            </TabsContent>

            <TabsContent value="collaboration" className="mt-4">
              <CollaborationCenter submissionId={submission.id} />
            </TabsContent>

            <TabsContent value="validation" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {submission.ai_confidence_score && (
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">KI-Vertrauen</span>
                        <span className="font-medium">{submission.ai_confidence_score}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${submission.ai_confidence_score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {submission.validation_errors?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-red-600">Fehler</h4>
                      {submission.validation_errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <span>{err.message || JSON.stringify(err)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {submission.validation_warnings?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-600">Warnungen</h4>
                      {submission.validation_warnings.map((warn, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <span>{warn.message || JSON.stringify(warn)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!submission.validation_errors || submission.validation_errors.length === 0) &&
                   (!submission.validation_warnings || submission.validation_warnings.length === 0) && (
                    <p className="text-center text-green-600 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Keine Validierungsfehler
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="report" className="mt-4">
              <ValidationReport submission={submission} />
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <ComplianceChecklist submission={submission} />
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <RiskAssessment submission={submission} />
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              <TrendAnalysisChart buildingId={submission.building_id} formType={submission.tax_form_type} />
            </TabsContent>

            <TabsContent value="optimization" className="mt-4">
              <TaxOptimizationSuggestions submission={submission} />
            </TabsContent>

            <TabsContent value="precheck" className="mt-4">
              <PreSubmissionCheck submission={submission} />
            </TabsContent>

            <TabsContent value="xml" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {submission.xml_data ? (
                    <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      {submission.xml_data}
                    </pre>
                  ) : (
                    <p className="text-center text-slate-500">Kein XML generiert</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="response" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {submission.elster_response ? (
                    <pre className="text-sm bg-slate-50 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(submission.elster_response, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-center text-slate-500">Noch keine Antwort von ELSTER</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>

            {/* Audit Log & Versionen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AuditLogViewer submissionId={submission.id} />
              <VersionHistory submissionId={submission.id} />
            </div>

            {/* Kommentare */}
            <CommentSection submissionId={submission.id} />

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <AutoCorrectButton 
              submissionId={submission.id}
              onSuccess={() => onOpenChange(false)}
            />
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              PDF exportieren
            </Button>
            {submission.status !== 'ARCHIVED' && (
              <Button onClick={handleArchive} variant="outline" className="flex-1">
                <Archive className="w-4 h-4 mr-2" />
                GoBD-Archivierung
              </Button>
            )}
            <Button onClick={() => setShowShareDialog(true)} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Mit Berater teilen
            </Button>
            <QuickDuplicateButton 
              submission={submission} 
              onSuccess={() => onOpenChange(false)} 
            />
          </div>
        </div>

        <ShareWithAdvisorDialog
        submission={submission}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        />
        </DialogContent>
        </Dialog>
        );
        }
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Clock, FileText, Send, Plus } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxAuditPreparation() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch audits
  const { data: audits = [] } = useQuery({
    queryKey: ['auditFiles', country, taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxAuditFile.filter({
        user_email: user.email,
        country,
        tax_year: taxYear
      }) || [];
    }
  });

  // Fetch readiness report
  const { data: readinessReport } = useQuery({
    queryKey: ['auditReadiness', selectedAudit?.id],
    queryFn: async () => {
      if (!selectedAudit?.id) return null;
      const { data } = await base44.functions.invoke('generateAuditReadinessReport', {
        country,
        taxYear,
        auditFileId: selectedAudit.id
      });
      return data;
    },
    enabled: !!selectedAudit?.id
  });

  // Update response
  const updateResponseMutation = useMutation({
    mutationFn: async (questionId, response) => {
      const updatedQuestions = selectedAudit.audit_questions.map(q => 
        q.id === questionId ? { ...q, response_provided: response } : q
      );
      return await base44.entities.TaxAuditFile.update(selectedAudit.id, {
        audit_questions: updatedQuestions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditFiles'] });
      queryClient.invalidateQueries({ queryKey: ['auditReadiness'] });
      setNewResponse('');
    }
  });

  if (audits.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🛡️ Tax Audit Preparation</h1>
          <p className="text-slate-500 mt-1">Vorbereitung auf Steuerprüfungen & Audits</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium">Land</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-dashed border-2 text-center py-12">
          <p className="text-slate-600 mb-4">Keine aktiven Prüfungen für diese Periode</p>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Neue Prüfung registrieren
          </Button>
        </Card>
      </div>
    );
  }

  const currentAudit = selectedAudit || audits[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🛡️ Tax Audit Preparation</h1>
        <p className="text-slate-500 mt-1">Umfassende Vorbereitung auf Steuerprüfungen</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Select Audit */}
      <div>
        <label className="text-sm font-medium">Prüfung auswählen</label>
        <Select value={currentAudit.id} onValueChange={(id) => setSelectedAudit(audits.find(a => a.id === id))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {audits.map(audit => (
              <SelectItem key={audit.id} value={audit.id}>
                {audit.audit_type} - {new Date(audit.audit_notice_date).toLocaleDateString('de-DE')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {readinessReport && (
        <>
          {/* Readiness Score */}
          <Card className={
            readinessReport.readiness.risk_level === 'low' ? 'border-green-300 bg-green-50' :
            readinessReport.readiness.risk_level === 'medium' ? 'border-yellow-300 bg-yellow-50' :
            'border-red-300 bg-red-50'
          }>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🎯 Audit Readiness Score</span>
                <Badge className={
                  readinessReport.readiness.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                  readinessReport.readiness.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  Risk: {readinessReport.readiness.risk_level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{readinessReport.readiness.score}%</span>
                  <span className="text-sm text-slate-600">{readinessReport.timeline.days_remaining} Tage verbleibend</span>
                </div>
                <Progress value={readinessReport.readiness.score} className="h-3" />
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
                {Object.entries(readinessReport.readiness.checklist).map(([key, checked]) => (
                  <div key={key} className="text-center p-3 rounded bg-white/50">
                    <div className="text-2xl mb-1">
                      {checked ? '✅' : '⭕'}
                    </div>
                    <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Zeitstrahl
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-600">Mitteilung</p>
                  <p className="font-semibold">{new Date(readinessReport.timeline.notice_received).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="flex-1 h-1 bg-slate-200" />
                <div className="text-center">
                  <p className="text-xs text-slate-600">Nächster Termin</p>
                  <p className="font-semibold text-orange-600">{new Date(readinessReport.timeline.next_deadline).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {readinessReport.recommendations.length > 0 && (
            <Card className="border-orange-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" /> Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {readinessReport.recommendations
                  .sort((a, b) => {
                    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border-l-4 ${
                        rec.priority === 'critical'
                          ? 'border-red-500 bg-red-50'
                          : rec.priority === 'high'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-500 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '⚠️' : '💡'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{rec.action}</h4>
                          <p className="text-sm text-slate-600 mt-1">{rec.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Tabs for Details */}
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="questions">Fragen ({readinessReport.audit_questions.unanswered})</TabsTrigger>
              <TabsTrigger value="documents">Dokumente ({readinessReport.documents.total_uploaded})</TabsTrigger>
              <TabsTrigger value="findings">Ergebnisse</TabsTrigger>
            </TabsList>

            {/* Questions */}
            <TabsContent value="questions" className="space-y-3 mt-4">
              {(currentAudit.audit_questions || []).map((q, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">❓</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{q.question}</h4>
                          <Badge className="mt-2">{q.category}</Badge>
                          {q.response_deadline && (
                            <p className="text-xs text-slate-600 mt-2">
                              Deadline: {new Date(q.response_deadline).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                      </div>

                      {q.response_provided ? (
                        <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                          <p className="text-sm">{q.response_provided}</p>
                        </div>
                      ) : (
                        <Textarea
                          placeholder="Ihre Antwort..."
                          defaultValue={newResponse}
                          onChange={(e) => setNewResponse(e.target.value)}
                          rows={3}
                        />
                      )}

                      {!q.response_provided && (
                        <Button
                          onClick={() => updateResponseMutation.mutate(q.id, newResponse)}
                          className="gap-2 bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Send className="w-4 h-4" /> Antwort einreichen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-3 mt-4">
              {(currentAudit.supporting_documents || []).map((doc, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <p className="font-semibold">{doc.document_type}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Hochgeladen: {new Date(doc.uploaded_date).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      {doc.is_critical && <Badge className="bg-red-100 text-red-800">Kritisch</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Findings */}
            <TabsContent value="findings" className="space-y-3 mt-4">
              {(currentAudit.audit_findings || []).length > 0 ? (
                (currentAudit.audit_findings || []).map((finding, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{finding.issue}</h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Betrag: {finding.amount?.toLocaleString()} €/CHF
                          </p>
                        </div>
                        <Badge className={
                          finding.severity === 'high' ? 'bg-red-100 text-red-800' :
                          finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {finding.severity}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="text-center py-8 text-slate-500">
                  Keine Ergebnisse vorhanden
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
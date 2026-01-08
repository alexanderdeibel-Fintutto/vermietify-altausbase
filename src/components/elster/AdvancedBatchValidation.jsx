import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, XCircle, AlertTriangle, Loader2, 
  FileCheck, Download, Eye 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AdvancedBatchValidation({ submissions, onOpenDetail }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleSelectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map(s => s.id));
    }
  };

  const handleValidate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Einreichung');
      return;
    }

    setValidating(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const response = await base44.functions.invoke('batchValidateSubmissions', {
        submission_ids: selectedIds
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResults(response.data);
      toast.success(`${response.data.passed} von ${selectedIds.length} erfolgreich validiert`);
    } catch (error) {
      toast.error('Batch-Validierung fehlgeschlagen');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const handleExportResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-results-${Date.now()}.json`;
    a.click();
    toast.success('Ergebnisse exportiert');
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warnings':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          Erweiterte Batch-Validierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedIds.length === submissions.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">
                Alle auswählen ({selectedIds.length}/{submissions.length})
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {submissions.map(sub => (
                <div 
                  key={sub.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                >
                  <Checkbox
                    checked={selectedIds.includes(sub.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds([...selectedIds, sub.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== sub.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {sub.tax_form_type} - {sub.tax_year}
                    </div>
                    <div className="text-xs text-slate-600">
                      {sub.legal_form} | Status: {sub.status}
                    </div>
                  </div>
                  <Badge variant="outline">{sub.status}</Badge>
                </div>
              ))}
            </div>

            {validating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Validierung läuft...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={handleValidate}
              disabled={validating || selectedIds.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {validating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4 mr-2" />
              )}
              {selectedIds.length} Einreichungen validieren
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Bestanden</span>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {results.passed}
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">Fehler</span>
                </div>
                <div className="text-2xl font-bold text-red-800">
                  {results.failed}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Warnungen</span>
                </div>
                <div className="text-2xl font-bold text-yellow-800">
                  {results.warnings}
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {results.details?.map((detail, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      {statusIcon(detail.status)}
                      <span className="text-sm">
                        {detail.submission_name || `Einreichung ${idx + 1}`}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-6">
                      {detail.errors?.map((err, errIdx) => (
                        <div key={errIdx} className="text-sm text-red-600 flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                      {detail.warnings?.map((warn, warnIdx) => (
                        <div key={warnIdx} className="text-sm text-yellow-600 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{warn}</span>
                        </div>
                      ))}
                      {detail.status === 'passed' && (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>Alle Prüfungen bestanden</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetail(detail.submission_id)}
                        className="mt-2"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details anzeigen
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResults(null);
                  setSelectedIds([]);
                  setProgress(0);
                }}
                className="flex-1"
              >
                Neue Validierung
              </Button>
              <Button
                variant="outline"
                onClick={handleExportResults}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
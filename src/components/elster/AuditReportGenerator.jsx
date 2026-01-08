import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AuditReportGenerator() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('comprehensive');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Erstelle einen umfassenden Audit-Report für ELSTER-Einreichungen.

BERICHTSZEITRAUM: ${dateFrom} bis ${dateTo}
REPORT-TYP: ${reportType}

Inkludiere:
1. Executive Summary
   - Anzahl Einreichungen
   - Erfolgsquote
   - Durchschnittliche Verarbeitungszeit
   - Kritische Vorfälle

2. Compliance-Status
   - GoBD-Konformität
   - Aufbewahrungsfristen
   - Datenschutz
   - Vollständigkeit

3. Qualitäts-Metriken
   - KI-Konfidenz-Scores
   - Validierungsergebnisse
   - Fehlerquoten
   - Trends

4. Risiko-Analyse
   - Identifizierte Risiken
   - Empfohlene Maßnahmen
   - Priorisierung

5. Verbesserungsvorschläge
   - Prozess-Optimierungen
   - Tool-Verbesserungen
   - Schulungsbedarf

6. Technische Metriken
   - System-Performance
   - Verfügbarkeit
   - Fehlerquoten
   - API-Nutzung

Format: Strukturiert und professionell für Steuerberater/Management`,
        response_json_schema: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string' },
            total_submissions: { type: 'number' },
            success_rate: { type: 'number' },
            compliance_score: { type: 'number' },
            risks_identified: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            quality_metrics: {
              type: 'object',
              properties: {
                avg_ai_confidence: { type: 'number' },
                avg_processing_time: { type: 'number' },
                error_rate: { type: 'number' }
              }
            }
          }
        }
      });

      // Generate PDF
      const pdfContent = `
ELSTER AUDIT REPORT
${new Date().toLocaleDateString('de-DE')}

${response.executive_summary}

STATISTIKEN:
- Einreichungen: ${response.total_submissions}
- Erfolgsrate: ${response.success_rate}%
- Compliance-Score: ${response.compliance_score}/100

IDENTIFIZIERTE RISIKEN:
${response.risks_identified?.map((r, i) => `${i + 1}. ${r}`).join('\n')}

EMPFEHLUNGEN:
${response.recommendations?.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();

      toast.success('Audit-Report generiert');
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Audit Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>Report-Typ</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Umfassend</SelectItem>
                <SelectItem value="compliance">Compliance-Fokus</SelectItem>
                <SelectItem value="technical">Technisch</SelectItem>
                <SelectItem value="management">Management Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Von</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Bis</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerateReport}
          disabled={generating || !dateFrom || !dateTo}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Report generieren
        </Button>

        <div className="text-xs text-slate-600 text-center">
          Professioneller Report für Wirtschaftsprüfer und Management
        </div>
      </CardContent>
    </Card>
  );
}
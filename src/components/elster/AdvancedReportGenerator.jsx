import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdvancedReportGenerator() {
  const [reportType, setReportType] = useState('');
  const [params, setParams] = useState({});
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (!reportType) {
      toast.error('Bitte Report-Typ wählen');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateTaxReport', {
        report_type: reportType,
        params
      });

      if (response.data.success) {
        setReport(response.data.report);
        toast.success('Report generiert');
      }
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elster_report_${report.type}_${Date.now()}.json`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Report-Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Report-Typ wählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly_summary">Jahres-Übersicht</SelectItem>
              <SelectItem value="compliance_overview">Compliance-Übersicht</SelectItem>
              <SelectItem value="performance_metrics">Performance-Metriken</SelectItem>
              <SelectItem value="audit_trail">Audit-Trail</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reportType === 'yearly_summary' && (
          <Input
            type="number"
            placeholder="Jahr"
            onChange={(e) => setParams({ year: parseInt(e.target.value) })}
          />
        )}

        <Button onClick={generateReport} disabled={generating} className="w-full">
          {generating ? 'Generiere...' : 'Report erstellen'}
        </Button>

        {report && (
          <div className="space-y-3 pt-3 border-t">
            <div className="text-sm font-medium">Ergebnis:</div>
            <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(report.data, null, 2)}
            </pre>
            <Button onClick={downloadReport} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Als JSON herunterladen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
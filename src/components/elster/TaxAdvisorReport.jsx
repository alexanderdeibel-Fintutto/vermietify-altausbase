import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxAdvisorReport() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateTaxAdvisorReport', { 
        year,
        include_raw_data: false 
      });
      
      if (response.data.success) {
        setReport(response.data.report);
        toast.success('Report generiert');
      }
    } catch (error) {
      toast.error('Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuerberater_report_${year}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Report exportiert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Steuerberater-Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(i => {
                const y = new Date().getFullYear() - 1 - i;
                return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Generieren'
            )}
          </Button>
        </div>

        {report && (
          <>
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div>
                <div className="text-xs text-slate-600">Erstellt am</div>
                <div className="text-sm font-medium">
                  {new Date(report.generated_at).toLocaleString('de-DE')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-600">Gesamt</div>
                  <div className="text-2xl font-bold">
                    {report.executive_summary.total_submissions}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Akzeptiert</div>
                  <div className="text-2xl font-bold text-green-700">
                    {report.executive_summary.accepted}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Prüfung nötig</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {report.data_quality_metrics.manual_review_required}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Ø Vertrauen</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {report.data_quality_metrics.avg_confidence}%
                  </div>
                </div>
              </div>
            </div>

            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Empfehlungen:</div>
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                    • {rec}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Nach Typ:</div>
              {Object.entries(report.submissions_by_type).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{type}</span>
                  <Badge>{data.count}</Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Exportieren
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
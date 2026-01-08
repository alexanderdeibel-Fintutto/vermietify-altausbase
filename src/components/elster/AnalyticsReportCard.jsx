import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AnalyticsReportCard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateAnalyticsReport', { year });
      
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

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elster-analytics-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Analytics Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report ? (
          <>
            <div>
              <Label>Jahr</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={new Date().getFullYear() + 1}
              />
            </div>
            <Button onClick={generateReport} disabled={generating} className="w-full">
              {generating ? 'Generiere...' : 'Report erstellen'}
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Submissions</div>
                <div className="font-bold">{report.overview.total_submissions}</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-xs text-slate-600">Akzeptanzrate</div>
                <div className="font-bold text-green-600">{report.performance.acceptance_rate}%</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-xs text-slate-600">KI-Vertrauen</div>
                <div className="font-bold text-blue-600">{report.performance.avg_confidence}%</div>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <div className="text-xs text-slate-600">Validierung</div>
                <div className="font-bold text-purple-600">{report.performance.validation_success_rate}%</div>
              </div>
            </div>

            {report.recommendations.length > 0 && (
              <div className="text-xs space-y-1">
                <div className="font-medium">Empfehlungen:</div>
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-slate-600">• {rec}</div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadReport} className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => setReport(null)} className="flex-1">
                Neu
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
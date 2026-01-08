import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Building, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExecutiveDashboard() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateExecutiveSummary', { year });
      
      if (response.data.success) {
        setSummary(response.data.summary);
        toast.success('Summary generiert');
      }
    } catch (error) {
      toast.error('Fehler beim Generieren');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022, 2021].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateSummary} disabled={loading}>
            {loading ? 'Lädt...' : 'Generieren'}
          </Button>
        </div>

        {summary && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-slate-600">Submissions</span>
                </div>
                <div className="text-2xl font-bold">{summary.overview.total_submissions}</div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-slate-600">Gebäude</span>
                </div>
                <div className="text-2xl font-bold">{summary.overview.total_buildings}</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-slate-600">Akzeptiert</span>
                </div>
                <div className="text-2xl font-bold">{summary.overview.completed}</div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-slate-600">Nettoertrag</span>
                </div>
                <div className="text-lg font-bold">€{summary.financial_summary.nettoertrag.toLocaleString('de-DE')}</div>
              </div>
            </div>

            {summary.action_items.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Handlungsbedarf</div>
                {summary.action_items.map((item, idx) => (
                  <div key={idx} className="text-xs p-2 bg-red-50 rounded">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
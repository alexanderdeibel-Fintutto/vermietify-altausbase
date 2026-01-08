import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function YearEndSummary() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateYearEndSummary', { year });
      
      if (response.data.success) {
        setSummary(response.data.summary);
        toast.success('Jahresabschluss generiert');
      }
    } catch (error) {
      toast.error('Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!summary) return;

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jahresabschluss_${year}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('Jahresabschluss exportiert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Jahresabschluss
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

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">Submissions</div>
                <div className="text-2xl font-bold text-blue-700">{summary.total_submissions}</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 mb-1">Akzeptiert</div>
                <div className="text-2xl font-bold text-green-700">{summary.accepted_count}</div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-600 mb-1">Gesamt-Einnahmen</div>
                <div className="text-xl font-bold text-purple-700">
                  {summary.total_revenue?.toLocaleString('de-DE')} €
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-xs text-orange-600 mb-1">Gesamt-Ausgaben</div>
                <div className="text-xl font-bold text-orange-700">
                  {summary.total_expenses?.toLocaleString('de-DE')} €
                </div>
              </div>
            </div>

            {summary.year_over_year && (
              <div className="p-3 border rounded">
                <div className="text-sm font-medium mb-2">Jahresvergleich</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">vs. Vorjahr</span>
                  <div className="flex items-center gap-2">
                    {summary.year_over_year.change > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">
                          +{summary.year_over_year.change}%
                        </Badge>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <Badge className="bg-red-100 text-red-800">
                          {summary.year_over_year.change}%
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              JSON exportieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
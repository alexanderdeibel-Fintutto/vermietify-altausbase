import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, TrendingUp, AlertTriangle, Building2, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function YearEndSummary() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateYearEndSummary', { tax_year: year });
      
      if (response.data.success) {
        setSummary(response.data);
        toast.success('Jahresabschluss generiert');
      }
    } catch (error) {
      toast.error('Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jahresabschluss
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Button onClick={generateSummary} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generieren'}
          </Button>
        </div>

        {summary && (
          <div className="space-y-4 pt-4 border-t">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Submissions</div>
                <div className="text-2xl font-bold">{summary.summary.total_submissions}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Ø Vertrauen</div>
                <div className="text-2xl font-bold">{summary.summary.avg_confidence}%</div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-slate-600">Einnahmen</div>
                  <div className="font-bold text-green-700">
                    {summary.summary.total_income.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Ausgaben</div>
                  <div className="font-bold text-red-700">
                    {summary.summary.total_expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Ergebnis</div>
                  <div className={`font-bold ${summary.summary.net_result >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {summary.summary.net_result.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {summary.recommendations?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Empfehlungen</div>
                {summary.recommendations.map((rec, idx) => (
                  <Alert key={idx} className={rec.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-sm mt-1">{rec.description}</div>
                      <div className="text-xs mt-1 text-slate-600">→ {rec.action}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Building Breakdown */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Pro Gebäude
              </div>
              {summary.building_breakdown?.map((building, idx) => (
                <div key={idx} className="p-3 border rounded text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{building.building_name}</div>
                    <Badge variant="outline">{building.submissions_count || 0} Submissions</Badge>
                  </div>
                  {building.status !== 'no_submission' && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-green-600">
                          {building.income?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-600">
                          -{building.expenses?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className={building.net_result >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {building.net_result?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
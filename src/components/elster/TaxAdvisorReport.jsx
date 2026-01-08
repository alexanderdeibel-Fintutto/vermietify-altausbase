import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxAdvisorReport() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTaxAdvisorReport', { 
        tax_year: year 
      });
      
      if (response.data.success) {
        setReport(response.data.report);
        toast.success('Bericht generiert');
      }
    } catch (error) {
      toast.error('Fehler beim Generieren');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuerberater_bericht_${year}.json`;
    a.click();
    toast.success('Bericht heruntergeladen');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Steuerberater-Bericht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Steuerjahr</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={generateReport} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Generieren
                </Button>
                {report && (
                  <Button onClick={downloadReport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>

            {report && (
              <div className="space-y-4 pt-4 border-t">
                {/* Zusammenfassung */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-green-700">Einnahmen</div>
                    <div className="text-lg font-bold text-green-900">
                      {report.summary.total_income.toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-xs text-red-700">Ausgaben</div>
                    <div className="text-lg font-bold text-red-900">
                      {report.summary.total_expenses.toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700">AfA</div>
                    <div className="text-lg font-bold text-blue-900">
                      {report.summary.total_afa.toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-700">Ergebnis</div>
                    <div className={`text-lg font-bold flex items-center gap-1 ${
                      report.summary.net_result < 0 ? 'text-red-900' : 'text-green-900'
                    }`}>
                      {report.summary.net_result < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                      {Math.abs(report.summary.net_result).toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-sm font-medium mb-2">Status-Übersicht</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(report.status_breakdown).map(([status, count]) => (
                      <Badge key={status} variant="outline">
                        {status}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Top Ausgaben */}
                {report.top_expenses.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Größte Ausgaben-Kategorien</div>
                    <div className="space-y-2">
                      {report.top_expenses.map((expense, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                          <span className="capitalize">{expense.category}</span>
                          <span className="font-medium">
                            {expense.amount.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empfehlungen */}
                {report.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Empfehlungen</div>
                    <div className="space-y-2">
                      {report.recommendations.map((rec, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border ${
                            rec.priority === 'high' 
                              ? 'bg-orange-50 border-orange-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Badge 
                              variant={rec.priority === 'high' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {rec.priority}
                            </Badge>
                            <div className="text-sm">{rec.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioOverviewReport() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generatePortfolioOverview');
      setReport(response.data.report);
      toast.success('Portfolio-Übersicht erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Portfolio-Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Übersicht generieren'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Portfolio Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Portfolio-Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-600">Gebäude</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {report.portfolio_summary.total_buildings}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-600">Einheiten</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {report.portfolio_summary.total_units}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-600">Belegungsquote</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {report.portfolio_summary.occupancy_rate}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-600">Wert (geschätzt)</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    €{(report.portfolio_summary.total_value_estimate || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Finanzübersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-slate-700">Jahreseinnahmen</span>
                  <span className="font-bold text-green-600">
                    €{(report.financial_overview.annual_income || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-slate-700">Jahresausgaben</span>
                  <span className="font-bold text-red-600">
                    €{(report.financial_overview.annual_expenses || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-900">Nettogewinn</span>
                  <span className={`font-bold text-lg ${report.financial_overview.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{(report.financial_overview.net_profit || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          {report.top_performers?.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-900">
                  <TrendingUp className="w-5 h-5" />
                  Top-Performer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.top_performers.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="font-bold text-slate-900">{item.building}</p>
                    <p className="text-sm text-slate-700 mt-1">{item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Underperformers */}
          {report.underperformers?.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-900">
                  <TrendingDown className="w-5 h-5" />
                  Verbesserungspotenzial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.underperformers.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="font-bold text-slate-900">{item.building}</p>
                    <p className="text-sm text-slate-700 mt-1">{item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations */}
          {report.strategic_recommendations?.length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Strategische Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.strategic_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-purple-600">→</span>
                      <span className="text-slate-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => setReport(null)} variant="outline" className="w-full">
            Neuer Bericht
          </Button>
        </div>
      )}
    </div>
  );
}
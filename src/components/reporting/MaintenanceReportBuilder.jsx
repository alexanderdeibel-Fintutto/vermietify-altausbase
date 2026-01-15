import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceReportBuilder({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateMaintenanceReport', {
        buildingId
      });

      setReport(response.data.report);
      toast.success('Wartungsbericht erstellt');
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
              <Wrench className="w-5 h-5 text-orange-600" />
              Wartungsbericht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Bericht generieren'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-600">Gesamt</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {report.status_overview.total_tasks}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                  <p className="text-xs text-red-700">Offen</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {report.status_overview.open}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <p className="text-xs text-green-700">Erledigt</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {report.status_overview.completed}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-xs text-blue-700">Quote</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(report.status_overview.completion_rate || 0).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          {report.priority_distribution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prioritätsverteilung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.priority_distribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.priority}</span>
                    <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.priority === 'HIGH' ? 'bg-red-600' :
                          item.priority === 'MEDIUM' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cost Analysis */}
          {report.cost_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kostenanalyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                    <p className="text-xs text-slate-600">Gesamt</p>
                    <p className="font-bold text-slate-900 mt-1">
                      €{(report.cost_analysis.total_estimated || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-xs text-green-700">Erledigt</p>
                    <p className="font-bold text-green-600 mt-1">
                      €{(report.cost_analysis.completed_cost || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                    <p className="text-xs text-orange-700">Ausstehend</p>
                    <p className="font-bold text-orange-600 mt-1">
                      €{(report.cost_analysis.pending_cost || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Urgent Actions */}
          {report.urgent_actions?.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-900">⚠️ Sofortige Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.urgent_actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-red-900">• {action}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-orange-600">→</span>
                      <span className="text-slate-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          {report.maintenance_schedule?.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Wartungsplan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.maintenance_schedule.map((item, idx) => (
                    <li key={idx} className="text-sm text-blue-900">📅 {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setReport(null)}
            variant="outline"
            className="w-full"
          >
            Neuer Bericht
          </Button>
        </div>
      )}
    </div>
  );
}
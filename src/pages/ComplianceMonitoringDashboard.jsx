import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default function ComplianceMonitoringDashboard() {
  const [country, setCountry] = useState('DE');
  const [monitoring, setMonitoring] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['complianceMonitoring', country],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComplianceMonitoring', {
        country
      });
      return response.data?.monitoring || {};
    },
    enabled: monitoring
  });

  const getHealthColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', label: 'Ausgezeichnet' };
    if (score >= 60) return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', label: 'Gut' };
    if (score >= 40) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600', label: 'Befriedigend' };
    return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', label: 'Handlungsbedarf' };
  };

  const healthColor = getHealthColor(result.content?.health_score || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Compliance-Überwachungs-Dashboard</h1>
        <p className="text-slate-500 mt-1">Echtzeit-Überwachung Ihrer Steuer-Compliance</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={monitoring}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setMonitoring(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={monitoring}
          >
            {monitoring ? '⏳ Wird überwacht...' : 'Überwachung starten'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Überwachung läuft...</div>
      ) : monitoring && result.content ? (
        <>
          {/* Health Score */}
          <Card className={`border-4 ${healthColor.border} ${healthColor.bg}`}>
            <CardHeader>
              <CardTitle className="text-sm">🏥 Compliance-Gesundheit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className={`text-3xl font-bold ${healthColor.text}`}>
                  {Math.round(result.content.health_score || 0)}%
                </p>
                <span className={`text-sm font-medium ${healthColor.text}`}>{healthColor.label}</span>
              </div>
              <Progress value={result.content.health_score || 0} className="h-2" />
            </CardContent>
          </Card>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Compliance-Elemente</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{result.metric_counts?.compliance_items || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Aktive Alerts</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{result.metric_counts?.alerts || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Items */}
          {(result.content?.critical_items || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  🚨 Kritische Elemente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.critical_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{item.title || item.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          {(result.content?.upcoming_deadlines || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  📅 Anstehende Termine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.upcoming_deadlines.map((deadline, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-orange-600 font-bold flex-shrink-0">⏱️</span>
                    {deadline}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Priority Tasks */}
          {(result.content?.priority_tasks || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Prioritätsaufgaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.priority_tasks.map((task, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {task}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completion Estimate */}
          {result.content?.completion_estimate && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">📈 Geschätzter Fertigstellungsplan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.content.completion_estimate}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Überwachung starten", um den Compliance-Status zu prüfen
        </div>
      )}
    </div>
  );
}
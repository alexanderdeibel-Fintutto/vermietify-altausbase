import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxComplianceTracker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);

  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['complianceReport', country, taxYear],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('generateComplianceReport', {
        country,
        taxYear
      });
      return data;
    },
    enabled: !!country && !!taxYear
  });

  const items = report.compliance_items || [];
  const stats = report.statistics || {};

  const statusIcons = {
    completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    in_progress: <Clock className="w-5 h-5 text-blue-600" />,
    pending: <AlertCircle className="w-5 h-5 text-slate-600" />,
    at_risk: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    overdue: <AlertTriangle className="w-5 h-5 text-red-600" />
  };

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    pending: 'bg-slate-100 text-slate-800',
    at_risk: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const complianceByType = {
    'filing_deadline': items.filter(i => i.compliance_type === 'filing_deadline').length,
    'documentation': items.filter(i => i.compliance_type === 'documentation').length,
    'audit_readiness': items.filter(i => i.compliance_type === 'audit_readiness').length,
    'tax_law_change': items.filter(i => i.compliance_type === 'tax_law_change').length,
    'record_retention': items.filter(i => i.compliance_type === 'record_retention').length
  };

  const typeChartData = [
    { name: 'Einreichungsfristen', value: complianceByType['filing_deadline'], fill: '#ef4444' },
    { name: 'Dokumentation', value: complianceByType['documentation'], fill: '#f59e0b' },
    { name: 'Audit-Readiness', value: complianceByType['audit_readiness'], fill: '#3b82f6' },
    { name: 'Rechtl. Änderungen', value: complianceByType['tax_law_change'], fill: '#10b981' },
    { name: 'Archivierung', value: complianceByType['record_retention'], fill: '#8b5cf6' }
  ];

  const statusChartData = [
    { name: 'Abgeschlossen', value: items.filter(i => i.status === 'completed').length, fill: '#10b981' },
    { name: 'Laufend', value: items.filter(i => i.status === 'in_progress').length, fill: '#3b82f6' },
    { name: 'Offen', value: items.filter(i => i.status === 'pending').length, fill: '#94a3b8' },
    { name: 'Risiko', value: items.filter(i => i.status === 'at_risk').length, fill: '#f59e0b' },
    { name: 'Überfällig', value: items.filter(i => i.status === 'overdue').length, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Tax Compliance Tracker</h1>
        <p className="text-slate-500 mt-1">Vollständiger Überblick über alle Compliance-Anforderungen</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
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

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">⏳ Lade Compliance-Daten...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Anforderungen</p>
                <p className="text-3xl font-bold">{stats.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-slate-600">Abgeschlossen</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-300">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-sm text-slate-600">Risiko</p>
                <p className="text-3xl font-bold text-orange-600">{stats.at_risk || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <p className="text-sm text-slate-600">Überfällig</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-blue-600 font-semibold">Compliance Score</p>
                <p className="text-3xl font-bold text-blue-700">{stats.overall_compliance_score || 0}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Gesamtfortschritt</p>
                <span className="text-sm">{stats.overall_compliance_score || 0}%</span>
              </div>
              <Progress value={stats.overall_compliance_score || 0} className="h-3" />
            </CardContent>
          </Card>

          {/* Alerts */}
          {stats.overdue > 0 && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                🚨 <strong>{stats.overdue} überfällige Anforderung(en)</strong> - Sofortiges Handeln erforderlich!
              </AlertDescription>
            </Alert>
          )}

          {stats.at_risk > 0 && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                ⚠️ <strong>{stats.at_risk} Anforderung(en) im Risiko</strong> - Priorisieren Sie diese Aufgaben
              </AlertDescription>
            </Alert>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance nach Typ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeChartData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typeChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status-Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChartData.filter(d => d.value > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed List */}
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Anforderungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.sort((a, b) => {
                  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                }).map((item, idx) => {
                  const daysUntil = Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${item.status === 'overdue' ? 'border-red-300 bg-red-50' : item.status === 'at_risk' ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 flex items-start gap-3">
                          <div className="mt-1">{statusIcons[item.status]}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.requirement}</h4>
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                            {item.risk_flags.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {item.risk_flags.map((flag, idx) => (
                                  <Badge key={idx} className="bg-red-100 text-red-800 text-xs">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-col items-end">
                          <Badge className={statusColors[item.status]}>{item.status}</Badge>
                          <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                          <div className="text-xs text-slate-600 text-right">
                            Deadline: {new Date(item.deadline).toLocaleDateString('de-DE')}
                            {daysUntil >= 0 && <p>in {daysUntil} Tagen</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Alert className="bg-blue-50 border-blue-300">
            <AlertDescription className="text-sm">
              💡 <strong>Tipp:</strong> Aktualisieren Sie regelmäßig den Status Ihrer Compliance-Anforderungen. 
              Ein Compliance Score von 100% stellt sicher, dass Sie audit-ready sind.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
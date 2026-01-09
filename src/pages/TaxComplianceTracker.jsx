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
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  at_risk: '#ef4444'
};

export default function TaxComplianceTracker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  // Fetch compliance report
  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['complianceReport', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComplianceReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    }
  });

  const complianceData = [
    { name: 'Completed', value: report.requirements_breakdown?.completed || 0, fill: COLORS.completed },
    { name: 'Pending', value: report.requirements_breakdown?.pending || 0, fill: COLORS.pending },
    { name: 'At Risk', value: report.requirements_breakdown?.at_risk || 0, fill: COLORS.at_risk }
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'at_risk':
        return '⚠️';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Tax Compliance Tracker</h1>
        <p className="text-slate-500 mt-1">Verfolgen Sie Ihren Compliance-Status</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Compliance-Report...</div>
      ) : (
        <>
          {/* Overall Status Card */}
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Gesamt-Compliance-Status</h3>
                  <Badge className="bg-blue-200 text-blue-800 text-lg px-3 py-1">
                    {report.compliance_score || 0}/100
                  </Badge>
                </div>
                <Progress value={report.compliance_score || 0} />
                <p className="text-sm text-slate-700">{report.overall_status}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{report.metrics?.compliance_rate || 0}%</p>
                <p className="text-xs text-slate-600 mt-1">Compliance-Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.round(report.metrics?.documentation_completeness || 0)}%</p>
                <p className="text-xs text-slate-600 mt-1">Dokumentation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{report.requirements_breakdown?.pending || 0}</p>
                <p className="text-xs text-slate-600 mt-1">Ausstehend</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{report.metrics?.critical_alerts || 0}</p>
                <p className="text-xs text-slate-600 mt-1">Kritische Issues</p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Anforderungen-Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Erfüllungsgrad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Compliance-Anforderungen</p>
                    <p className="text-sm font-bold">
                      {report.requirements_breakdown?.completed}/{report.requirements_breakdown?.total}
                    </p>
                  </div>
                  <Progress
                    value={
                      (report.requirements_breakdown?.completed / report.requirements_breakdown?.total) * 100 || 0
                    }
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Dokumentation</p>
                    <p className="text-sm font-bold">{Math.round(report.metrics?.documentation_completeness || 0)}%</p>
                  </div>
                  <Progress value={report.metrics?.documentation_completeness || 0} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Einreichung</p>
                    <p className="text-sm font-bold">{Math.round(report.metrics?.filing_status || 0)}%</p>
                  </div>
                  <Progress value={report.metrics?.filing_status || 0} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎯 Compliance-Anforderungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {(report.requirements_details || []).map((req, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-lg">{getStatusIcon(req.status)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{req.requirement}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={req.completion} className="flex-1 h-1.5" />
                      <span className="text-xs text-slate-600">{Math.round(req.completion)}%</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(req.status)}>{req.status?.toUpperCase()}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements */}
          {(report.key_achievements || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Erfolge</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.key_achievements.map((achievement, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-600">✓</span> {achievement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Priority Actions */}
          {(report.priority_actions || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">🎯 Prioritäre Aktionen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.priority_actions.map((action, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Badge className="flex-shrink-0 bg-orange-200 text-orange-800 text-xs mt-0.5">
                        {i + 1}
                      </Badge>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(report.recommendations || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span>→</span> {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
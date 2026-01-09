import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, FileText, TrendingUp, Download
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function TaxDashboard() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  // Fetch comprehensive tax report
  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['taxReport', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComprehensiveTaxReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-50 border-green-300';
      case 'needs_attention':
        return 'bg-yellow-50 border-yellow-300';
      case 'at_risk':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-slate-50 border-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track':
        return '✅';
      case 'needs_attention':
        return '⚠️';
      case 'at_risk':
        return '🔴';
      default:
        return 'ℹ️';
    }
  };

  const documentData = Object.entries(report.documents?.by_type || {}).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));

  if (isLoading) {
    return <div className="text-center py-8">⏳ Lade Steuerdashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">📊 Tax Dashboard</h1>
          <p className="text-slate-500 mt-1">Gesamtübersicht Ihrer Steuersituation</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Download className="w-4 h-4" /> Bericht exportieren
        </Button>
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

      {/* Overall Status Alert */}
      <Alert className={`border-2 ${getStatusColor(report.summary?.overall_status)}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{getStatusIcon(report.summary?.overall_status)} Status:</strong> {
            report.summary?.overall_status === 'on_track'
              ? 'Alles ist im Plan - Steuererklärung läuft reibungslos'
              : report.summary?.overall_status === 'needs_attention'
              ? 'Einige Punkte erfordern Aufmerksamkeit'
              : 'Risiken erkannt - Handlungsbedarf notwendig'
          }
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Steuerschuld</p>
            <p className="text-3xl font-bold mt-2">
              €{Math.round(report.summary?.total_tax || 0).toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Dokumente</p>
            <p className="text-3xl font-bold mt-2">{report.documents?.count || 0}</p>
            <Progress value={(report.documents?.count || 0) / 20 * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card className={report.alerts?.count > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Ausstehende Alerts</p>
            <p className="text-3xl font-bold mt-2">{report.alerts?.count || 0}</p>
            {report.alerts?.critical > 0 && (
              <Badge className="mt-2 bg-red-100 text-red-800">
                🔴 {report.alerts.critical} kritisch
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Compliance-Rate</p>
            <p className="text-3xl font-bold mt-2">{report.summary?.compliance_rate || 0}%</p>
            <Progress value={report.summary?.compliance_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              💡 Nächste Schritte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-blue-600">→</span> {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filing Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📋 Steuererklärung Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium">Fertigstellung</p>
                <Badge>{report.filings?.completion_percentage || 0}%</Badge>
              </div>
              <Progress value={report.filings?.completion_percentage || 0} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold">{report.filings?.status?.toUpperCase() || 'DRAFT'}</span>
              </div>
              <div className="flex justify-between">
                <span>Eingereichte Formulare:</span>
                <span className="font-semibold">{report.filings?.count || 0}</span>
              </div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Zur Steuererklärung
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📅 Termine & Fristen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ausstehende Termine</span>
                <Badge className="bg-blue-100 text-blue-800">{report.deadlines?.total || 0}</Badge>
              </div>
              {report.deadlines?.urgent > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">🔴 Dringende (≤ 14 Tage)</span>
                  <Badge className="bg-red-100 text-red-800">{report.deadlines.urgent}</Badge>
                </div>
              )}
            </div>
            <Button className="w-full" variant="outline">
              Zum Kalender
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">✅ Compliance Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded border border-green-200">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
              <p className="text-2xl font-bold mt-2">{report.compliance?.completed || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Abgeschlossen</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded border border-yellow-200">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto" />
              <p className="text-2xl font-bold mt-2">{report.compliance?.pending || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Ausstehend</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
              <FileText className="w-6 h-6 text-blue-600 mx-auto" />
              <p className="text-2xl font-bold mt-2">{report.compliance?.total || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Gesamt</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
              <p className="text-2xl font-bold mt-2">{report.compliance?.at_risk || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Gefährdet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Breakdown */}
      {documentData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📄 Dokumente nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alert Summary */}
      {report.alerts?.count > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm">⚠️ Alert Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.alerts?.critical > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">🔴 KRITISCH</Badge>
                <span className="text-sm">{report.alerts.critical} kritische Alerts</span>
              </div>
            )}
            {report.alerts?.warnings > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">🟡 WARNUNG</Badge>
                <span className="text-sm">{report.alerts.warnings} Warnungen</span>
              </div>
            )}
            <Button className="w-full mt-2" variant="outline">
              Alle Alerts ansehen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Info */}
      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="pt-6 text-xs text-slate-600">
          📋 Bericht generiert: {report.generated_at ? new Date(report.generated_at).toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Lädt...'}
        </CardContent>
      </Card>
    </div>
  );
}
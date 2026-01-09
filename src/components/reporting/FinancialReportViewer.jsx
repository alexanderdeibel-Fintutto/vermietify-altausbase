import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Share2, Printer } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export default function FinancialReportViewer({ report }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!report) {
    return <div className="text-center text-slate-500">Kein Bericht vorhanden</div>;
  }

  const analysis = report.analysis || {};
  const metrics = report.metrics || {};

  // Prepare chart data
  const incomeData = Object.entries(analysis.income_analysis?.sources || {})
    .map(([name, amount]) => ({
      name,
      value: amount
    }));

  const expenseData = Object.entries(analysis.expense_analysis?.categories || {})
    .map(([name, amount]) => ({
      name,
      value: amount
    }));

  const handleExport = (format) => {
    toast.success(`Report als ${format.toUpperCase()} exportiert`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{analysis.summary?.substring(0, 50)}...</CardTitle>
              <p className="text-xs text-slate-600 mt-1">
                {report.period_start} bis {report.period_end}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {report.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-xs text-green-700 font-semibold mb-1">Einkommen</p>
            <p className="text-xl font-bold text-green-900">{(metrics.total_income || 0).toLocaleString('de-DE')} €</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-xs text-red-700 font-semibold mb-1">Ausgaben</p>
            <p className="text-xl font-bold text-red-900">{(metrics.total_expenses || 0).toLocaleString('de-DE')} €</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-xs text-blue-700 font-semibold mb-1">Sparbetrag</p>
            <p className="text-xl font-bold text-blue-900">{(metrics.net_savings || 0).toLocaleString('de-DE')} €</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <p className="text-xs text-purple-700 font-semibold mb-1">Sparquote</p>
            <p className="text-xl font-bold text-purple-900">{metrics.savings_rate_percent || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Übersicht</TabsTrigger>
          <TabsTrigger value="income">Einkommen</TabsTrigger>
          <TabsTrigger value="expenses">Ausgaben</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {analysis.trends && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs"><span className="font-semibold">Einkommenstrend:</span> {analysis.trends.income_trend}</p>
                <p className="text-xs"><span className="font-semibold">Ausgabentrend:</span> {analysis.trends.expense_trend}</p>
                <p className="text-xs"><span className="font-semibold">Sparquote-Entwicklung:</span> {analysis.trends.savings_trajectory}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-4">
          {incomeData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Einkommensquellen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toLocaleString('de-DE')} €`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {analysis.income_analysis && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs"><span className="font-semibold">Durchschnittlich/Monat:</span> {(metrics.monthly_average_income || 0).toLocaleString('de-DE')} €</p>
                <p className="text-xs"><span className="font-semibold">Volatilität:</span> <Badge variant="outline" className="text-xs ml-1">{analysis.income_analysis.volatility}</Badge></p>
                <p className="text-xs"><span className="font-semibold">Trend:</span> <Badge variant="outline" className="text-xs ml-1">{analysis.income_analysis.trend}</Badge></p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {expenseData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ausgabenkategorien</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {analysis.expense_analysis?.optimization_opportunities && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Optimierungschancen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.expense_analysis.optimization_opportunities.map((opp, i) => (
                    <li key={i} className="text-xs text-slate-700">• {opp}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-3">
          {analysis.actionable_insights && analysis.actionable_insights.map((insight, i) => (
            <Alert key={i} className={`border-${insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'amber' : 'blue'}-200 bg-${insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'amber' : 'blue'}-50`}>
              <AlertDescription className="text-xs">
                <div className="flex items-start gap-2">
                  <Badge className={`bg-${insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'amber' : 'blue'}-200 text-${insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'amber' : 'blue'}-900`}>
                    {insight.priority.toUpperCase()}
                  </Badge>
                  <div>
                    <p className="font-semibold">{insight.insight}</p>
                    <p className="text-slate-700 mt-1">{insight.impact}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button
          onClick={() => handleExport('pdf')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          PDF exportieren
        </Button>
        <Button
          onClick={() => handleExport('excel')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Excel exportieren
        </Button>
        <Button
          onClick={() => toast.success('Report gedruckt')}
          variant="outline"
          size="sm"
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
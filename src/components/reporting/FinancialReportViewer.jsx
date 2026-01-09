import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Share2, Printer, Zap, Brain } from 'lucide-react';
import { toast } from 'sonner';
import CostOptimizationPanel from './CostOptimizationPanel';
import AIInsightsPanel from './AIInsightsPanel';
import ExportButton from './ExportButton';

const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export default function FinancialReportViewer({ report }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

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

  const handleAnalyzeCosts = async () => {
    try {
      const response = await base44.functions.invoke('generateCostOptimizationAnalysis', {
        report_id: report.id,
        metrics: report.metrics,
        period_start: report.period_start,
        period_end: report.period_end,
        historical_data: report.metrics
      });
      setCostAnalysis(response.data.analysis);
      toast.success('Kostenanalyse abgeschlossen');
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleGenerateAIInsights = async () => {
    try {
      setGeneratingInsights(true);
      
      // Generate predictive analytics
      const forecastResponse = await base44.functions.invoke('generatePredictiveAnalytics', {
        metrics: report.metrics,
        historical_data: report.metrics,
        forecast_periods: 6
      });

      // Detect anomalies
      const anomalyResponse = await base44.functions.invoke('detectAnomalies', {
        transactions: report.transactions || [],
        metrics: report.metrics,
        historical_patterns: report.metrics.expense_analysis?.categories || {}
      });

      // Generate executive summary
      const summaryResponse = await base44.functions.invoke('generateExecutiveSummary', {
        metrics: report.metrics,
        analysis: report.analysis,
        cost_opportunities: costAnalysis?.cost_reduction_opportunities || [],
        anomalies: anomalyResponse.data.anomalies || [],
        forecast: forecastResponse.data.forecast,
        period_start: report.period_start,
        period_end: report.period_end
      });

      setAiInsights({
        executive_summary: summaryResponse.data.executive_summary,
        key_takeaways: summaryResponse.data.key_takeaways,
        forecast: forecastResponse.data.forecast,
        ai_analysis: anomalyResponse.data.ai_analysis
      });

      toast.success('AI-Insights generiert');
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setGeneratingInsights(false);
    }
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary">Übersicht</TabsTrigger>
          <TabsTrigger value="income">Einkommen</TabsTrigger>
          <TabsTrigger value="expenses">Ausgaben</TabsTrigger>
          <TabsTrigger value="optimization">Optimierung</TabsTrigger>
          <TabsTrigger value="ai">AI-Insights</TabsTrigger>
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

        {/* AI Insights Tab */}
        <TabsContent value="ai" className="space-y-4">
          {!aiInsights ? (
            <Card>
              <CardContent className="pt-4">
                <div className="text-center space-y-4">
                  <Brain className="w-12 h-12 text-purple-500 mx-auto" />
                  <div>
                    <p className="font-semibold mb-1">AI-gestützte Analyse</p>
                    <p className="text-xs text-slate-600 mb-4">
                      Prognosen, Anomalieerkennung und Executive Summary
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateAIInsights}
                    disabled={generatingInsights}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generatingInsights ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        AI-Insights generieren
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                onClick={handleGenerateAIInsights}
                disabled={generatingInsights}
                variant="outline"
                size="sm"
              >
                {generatingInsights ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Neu analysieren...
                  </>
                ) : (
                  'Neu analysieren'
                )}
              </Button>
              <AIInsightsPanel insights={aiInsights} />
            </>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          {!costAnalysis ? (
            <Card>
              <CardContent className="pt-4">
                <div className="text-center space-y-4">
                  <Zap className="w-12 h-12 text-blue-500 mx-auto" />
                  <div>
                    <p className="font-semibold mb-1">Kostenoptimierungsanalyse</p>
                    <p className="text-xs text-slate-600 mb-4">
                      AI-gestützte Analyse zur Identifizierung von Sparpotentialen
                    </p>
                  </div>
                  <Button
                    onClick={handleAnalyzeCosts}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Analyse starten
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                onClick={handleAnalyzeCosts}
                variant="outline"
                size="sm"
                className="mb-2"
              >
                Neu analysieren
              </Button>
              <CostOptimizationPanel analysis={costAnalysis} />
            </>
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
            <ExportButton reportType="financial_trends" />
            <Button
              onClick={() => toast.success('Report gedruckt')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Drucken
            </Button>
          </div>
    </div>
  );
}
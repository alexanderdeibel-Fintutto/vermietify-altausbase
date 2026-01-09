import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminTesterAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['testerAnalytics', timeRange],
    queryFn: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (parseInt(timeRange) * 86400000)).toISOString().split('T')[0];
      
      return base44.functions.invoke('generateTesterAnalytics', {
        start_date: startDate,
        end_date: endDate
      });
    },
    refetchInterval: 30000
  });

  const data = analyticsData?.data;

  const handleExport = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('exportTesterReport', {
        format: 'pdf',
        date_range: timeRange,
        include_sections: ['overview', 'problems', 'journeys', 'recommendations']
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 mb-2">Tester-Auswertung & UX-Analytics 📊</h1>
            <p className="text-sm font-light text-slate-600">Detaillierte Analyse von Tester-Verhalten und UX-Problemen</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Zeitraum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Heute</SelectItem>
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
                <SelectItem value="90">90 Tage</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={loading} className="gap-2 font-light">
              <Download className="w-4 h-4" />
              {loading ? 'Wird exportiert...' : 'Report exportieren'}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Gesamt Tester</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-light text-slate-900">{data.total_testers}</h3>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Aktive Sessions</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-light text-slate-900">{data.active_sessions}</h3>
                <Badge className="bg-green-100 text-green-800">🟢 Live</Badge>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Completion-Rate</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-light text-slate-900">{data.completion_rate}%</h3>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Probleme gemeldet</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-light text-slate-900">{data.problems_reported}</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="problems" className="bg-white rounded-lg border border-slate-200">
          <TabsList className="grid w-full grid-cols-3 border-b border-slate-200 bg-slate-50 font-light">
            <TabsTrigger value="problems">🐛 Problem-Bereiche</TabsTrigger>
            <TabsTrigger value="journeys">🛣️ User-Journeys</TabsTrigger>
            <TabsTrigger value="performance">📈 Performance</TabsTrigger>
          </TabsList>

          {/* Problems Tab */}
          <TabsContent value="problems" className="p-6 space-y-6">
            {data?.top_problem_pages?.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Problem Frequency Chart */}
                  <Card className="p-6 border border-slate-200">
                    <h3 className="font-light text-slate-900 mb-4">Top Problem-Seiten</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.top_problem_pages.map(p => ({
                        name: p.page_title?.slice(0, 20) || 'Unbekannt',
                        problems: p.count,
                        severity: Math.round(p.avg_severity)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="problems" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Problem Distribution */}
                  <Card className="p-6 border border-slate-200">
                    <h3 className="font-light text-slate-900 mb-4">Problem-Kategorien</h3>
                    <div className="space-y-3">
                      {data.top_problem_pages.slice(0, 5).map((problem, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-light text-slate-700">{problem.page_title?.slice(0, 30)}</span>
                            <Badge className="bg-slate-700 font-light text-xs">{problem.count} Reports</Badge>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${(problem.count / Math.max(...data.top_problem_pages.map(p => p.count), 1)) * 100}%` }}
                            />
                          </div>
                          {problem.problems && (
                            <p className="text-xs font-light text-slate-500 ml-1">
                              {problem.problems.slice(0, 1).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Keine Problem-Daten verfügbar</p>
            )}
          </TabsContent>

          {/* Journeys Tab */}
          <TabsContent value="journeys" className="p-6 space-y-6">
            <Card className="p-6 border border-slate-200">
              <h3 className="font-light text-slate-900 mb-4">Häufigste User-Journey-Pfade</h3>
              <p className="text-sm font-light text-slate-600 mb-4">Zeigt die häufigsten Navigationspfade der Tester</p>
              <div className="space-y-3">
                <p className="text-center text-slate-500 font-light py-8">
                  Journey-Visualisierung wird generiert... Nutze die Analytics-Daten aus generateTesterAnalytics.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-slate-200">
                <h3 className="font-light text-slate-900 mb-4">Session-Performance</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-light text-slate-600 mb-1">Ø Session-Länge</p>
                    <p className="text-2xl font-light text-slate-900">{data?.avg_session_duration || 0} min</p>
                  </div>
                  <div>
                    <p className="text-sm font-light text-slate-600 mb-1">Bounce-Rate</p>
                    <p className="text-2xl font-light text-slate-900">{data?.bounce_rate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-light text-slate-600 mb-1">Completion-Rate</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-light text-slate-900">{data?.completion_rate || 0}%</p>
                      <div className="w-20 h-2 bg-slate-200 rounded-full">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${data?.completion_rate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-slate-200">
                <h3 className="font-light text-slate-900 mb-4">Seiten-Engagement</h3>
                {data?.heatmap_data ? (
                  <div className="space-y-2">
                    {Object.entries(data.heatmap_data)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([page, clicks], idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-light text-slate-700 truncate max-w-[200px]">{page.slice(0, 25)}</span>
                          <Badge className="bg-blue-100 text-blue-800 font-light text-xs">{clicks} Klicks</Badge>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-sm font-light text-slate-500">Keine Daten</p>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
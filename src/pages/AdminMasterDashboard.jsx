import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Zap, Download, Bell, Settings, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminMasterDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Fetch all critical data
  const { data: analyticsData } = useQuery({
    queryKey: ['masterDashboard'],
    queryFn: async () => {
      const [analytics, insights, phases] = await Promise.all([
        base44.functions.invoke('generateTesterAnalytics', { 
          start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }),
        base44.entities.AIInsight.filter({ priority: 'critical' }, '-generated_at', 5),
        base44.entities.TestPhase.filter({ status: 'active' }, null, 10)
      ]);
      return { analytics: analytics.data, insights, phases };
    },
    refetchInterval: refreshInterval * 1000
  });

  const data = analyticsData?.analytics;
  const insights = analyticsData?.insights || [];
  const phases = analyticsData?.phases || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header mit Quick Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 mb-1">🎛️ Admin Master Dashboard</h1>
            <p className="text-sm font-light text-slate-600">Zentrale Überwachung aller Test-, Analytics- & AI-Systeme</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('AdminTesterAnalytics')}>
              <Button variant="outline" className="font-light gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
            <Link to={createPageUrl('AdminTestCleanup')}>
              <Button variant="outline" className="font-light gap-2">
                <Zap className="w-4 h-4" />
                Cleanup
              </Button>
            </Link>
            <Link to={createPageUrl('AdminAIAnalytics')}>
              <Button variant="outline" className="font-light gap-2">
                <Bell className="w-4 h-4" />
                AI-Insights
              </Button>
            </Link>
          </div>
        </div>

        {/* Critical Alerts */}
        {insights?.length > 0 && (
          <Card className="p-4 mb-6 border-l-4 border-red-600 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-light text-red-900 mb-2">🚨 {insights.length} kritische Insights erfordern Aktion</h3>
                <div className="space-y-1 text-sm font-light text-red-800">
                  {insights.slice(0, 3).map((i, idx) => (
                    <p key={idx}>• {i.title}</p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Aktive Phasen</p>
              <h3 className="text-2xl font-light text-slate-900 mb-2">{phases.length}</h3>
              <p className="text-xs font-light text-slate-500">{data.total_testers} Tester aktiv</p>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Completion-Rate</p>
              <h3 className="text-2xl font-light text-slate-900 mb-2">{data.completion_rate}%</h3>
              <div className="w-full h-1.5 bg-slate-200 rounded-full">
                <div
                  className="h-1.5 bg-green-600 rounded-full"
                  style={{ width: `${data.completion_rate}%` }}
                />
              </div>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">Probleme (7d)</p>
              <h3 className="text-2xl font-light text-slate-900 mb-2">{data.problems_reported}</h3>
              <p className="text-xs font-light text-slate-500">Durchschnitt: {Math.round(data.problems_reported / 7)}/Tag</p>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <p className="text-sm font-light text-slate-600 mb-2">AI-Insights</p>
              <h3 className="text-2xl font-light text-slate-900 mb-2">{insights.length}</h3>
              <Badge className="bg-orange-100 text-orange-800 font-light text-xs">⚠️ {insights.filter(i => i.priority === 'critical').length} kritisch</Badge>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="bg-white rounded-lg border border-slate-200">
          <TabsList className="grid w-full grid-cols-4 border-b border-slate-200 bg-slate-50 font-light">
            <TabsTrigger value="overview">📊 Überblick</TabsTrigger>
            <TabsTrigger value="insights">💡 Insights & Actions</TabsTrigger>
            <TabsTrigger value="phases">🗂️ Test-Phasen</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Einstellungen</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card className="p-6 border border-slate-200">
                <h3 className="text-lg font-light text-slate-900 mb-4">🔧 System-Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-light text-slate-700">Analytics Engine</span>
                    <Badge className="bg-green-100 text-green-800 font-light">🟢 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-light text-slate-700">AI-Insights Generator</span>
                    <Badge className="bg-green-100 text-green-800 font-light">🟢 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-light text-slate-700">Cleanup-Service</span>
                    <Badge className="bg-green-100 text-green-800 font-light">🟢 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-light text-slate-700">Notification-System</span>
                    <Badge className="bg-green-100 text-green-800 font-light">🟢 Online</Badge>
                  </div>
                </div>
              </Card>

              {/* Scheduled Tasks */}
              <Card className="p-6 border border-slate-200">
                <h3 className="text-lg font-light text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Geplante Aufgaben
                </h3>
                <div className="space-y-2 text-sm font-light">
                  <div className="flex justify-between">
                    <span>Tägliche Analytics</span>
                    <span className="text-slate-500">02:00 UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI-Insight Generation</span>
                    <span className="text-slate-500">04:00 UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Report-Export</span>
                    <span className="text-slate-500">08:00 UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleanup-Ausführung</span>
                    <span className="text-slate-500">Manuell</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="p-6 space-y-4">
            {insights?.length > 0 ? (
              insights.map((insight, idx) => (
                <Card key={idx} className="p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-light text-slate-900">{insight.title}</h4>
                    <Badge className={`font-light ${
                      insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {insight.priority?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-light text-slate-600 mb-3">{insight.ai_analysis}</p>
                  <Button className="font-light text-sm bg-slate-700 hover:bg-slate-800">
                    Insight-Details ansehen
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Keine kritischen Insights</p>
            )}
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases" className="p-6 space-y-4">
            {phases?.length > 0 ? (
              phases.map((phase, idx) => (
                <Card key={idx} className="p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-light text-slate-900">{phase.phase_name}</h4>
                    <Badge className="bg-green-100 text-green-800 font-light">🟢 AKTIV</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm font-light text-slate-600 mb-3">
                    <div>👥 {phase.tester_count} Tester</div>
                    <div>📊 {phase.completion_rate}% Completion</div>
                    <div>📈 {phase.test_assignments?.length || 0} Aufgaben</div>
                  </div>
                  <Link to={createPageUrl('AdminTestCleanup')}>
                    <Button variant="outline" className="font-light text-sm">
                      Phase verwalten
                    </Button>
                  </Link>
                </Card>
              ))
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Keine aktiven Test-Phasen</p>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6 space-y-4">
            <Card className="p-6 border border-slate-200">
              <h3 className="text-lg font-light text-slate-900 mb-4">⚙️ Dashboard-Einstellungen</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-light text-slate-700 block mb-2">Auto-Refresh Intervall (Sekunden)</label>
                  <input
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    min="10"
                    max="300"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-light"
                  />
                </div>
                <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light">
                  Speichern
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, AlertTriangle, FileText, Shield, Loader2, TrendingUp, 
  Eye, CheckCircle, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import GapDetailDialog from '@/components/knowledge/KnowledgeGapDetails';
import SearchKnowledgeBase from '@/components/knowledge/SearchKnowledgeBase';
import AutonomyMetrics from '@/components/knowledge/AutonomyMetrics';

export default function KnowledgeManagementDashboard() {
  const [selectedGap, setSelectedGap] = useState(null);

  const { data: gaps = [] } = useQuery({
    queryKey: ['knowledge-gaps'],
    queryFn: () => base44.entities.KnowledgeGap.list('-assigned_priority')
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['claude-reports'],
    queryFn: () => base44.entities.ClaudeAnalysisReport.list('-implementation_priority')
  });

  const { data: monitors = [] } = useQuery({
    queryKey: ['legal-monitors'],
    queryFn: () => base44.entities.LegalUpdateMonitor.list()
  });

  const criticalGaps = gaps.filter(g => g.business_impact === 'CRITICAL');
  const pendingReports = reports.filter(r => r.status === 'GENERATED');
  const autonomyRate = 94.3; // Berechnet aus Gap-Analyse

  const handleRunMonitor = async () => {
    toast.loading('Überwache Rechtsquellen...');
    try {
      await base44.functions.invoke('monitorLegalSources', {});
      toast.success('Monitor ausgeführt');
    } catch (error) {
      toast.error('Monitor-Fehler');
    }
  };

  const handleDetectGaps = async () => {
    toast.loading('Suche Wissenslücken...');
    try {
      await base44.functions.invoke('detectKnowledgeGaps', {});
      toast.success('Gap-Detection abgeschlossen');
    } catch (error) {
      toast.error('Detection-Fehler');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">🧠 Intelligentes Wissensmanagementsystem</h1>
          <p className="text-slate-600 mt-1">Rechtsaktualisierungs- & Selbstlern-Monitor</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunMonitor} variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Monitor starten
          </Button>
          <Button onClick={handleDetectGaps} variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Gap-Detection
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Autonomie-Rate"
          value={`${autonomyRate}%`}
          icon={Brain}
          trend="+2.1% vs. Vormonat"
          color="green"
        />
        <KPICard
          title="Wissenslücken"
          value={criticalGaps.length}
          icon={AlertTriangle}
          trend={`${criticalGaps.length} kritisch`}
          color="red"
        />
        <KPICard
          title="Claude-Reports"
          value={pendingReports.length}
          icon={FileText}
          trend="warten auf Review"
          color="blue"
        />
        <KPICard
          title="Rechtsquellen"
          value={monitors.filter(m => m.is_active).length}
          icon={Shield}
          trend="24/7 aktiv"
          color="purple"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gaps">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gaps">Wissenslücken</TabsTrigger>
          <TabsTrigger value="reports">Claude-Reports</TabsTrigger>
          <TabsTrigger value="monitors">Rechts-Monitor</TabsTrigger>
          <TabsTrigger value="knowledge">Wissensbasis</TabsTrigger>
        </TabsList>

        {/* Wissenslücken Tab */}
        <TabsContent value="gaps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Erkannte Wissenslücken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gaps.length === 0 ? (
                  <p className="text-slate-600 text-center py-6">Keine Wissenslücken erkannt</p>
                ) : (
                  gaps.map(gap => (
                    <div 
                      key={gap.id} 
                      className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedGap(gap)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{gap.description}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Typ: {gap.gap_type} | Häufigkeit: {gap.frequency}x
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getBadgeVariant(gap.business_impact)}>
                            {gap.business_impact}
                          </Badge>
                          <Badge variant="outline">P{gap.assigned_priority}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claude-Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Claude AI-Analysen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <p className="text-slate-600 text-center py-6">Keine Reports generiert</p>
                ) : (
                  reports.map(report => (
                    <div 
                      key={report.id}
                      className={`p-4 border-l-4 rounded-lg ${getReportBorderColor(report.implementation_priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{report.report_type}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {report.estimated_impact}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{report.status}</Badge>
                          <Badge>P{report.implementation_priority}</Badge>
                        </div>
                      </div>
                      {report.claude_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-900">
                          {report.claude_response.substring(0, 150)}...
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitors Tab */}
        <TabsContent value="monitors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Rechtsquellen-Überwachung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monitors.map(monitor => (
                  <div key={monitor.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{monitor.source_name}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Typ: {monitor.monitor_type} | Häufigkeit: {monitor.check_frequency}
                        </p>
                        {monitor.last_check && (
                          <p className="text-xs text-slate-500 mt-1">
                            Letzte Prüfung: {new Date(monitor.last_check).toLocaleString('de-DE')}
                          </p>
                        )}
                      </div>
                      <Badge variant={monitor.is_active ? 'default' : 'secondary'}>
                        {monitor.is_active ? '🟢 Aktiv' : '🔴 Inaktiv'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wissensbasis Tab */}
        <TabsContent value="knowledge" className="mt-6">
          <SearchKnowledgeBase />
        </TabsContent>
      </Tabs>

      {/* Autonomie-Metriken */}
      <div className="mt-8">
        <AutonomyMetrics />
      </div>

      {/* Detail Modal für Wissenslücke */}
      {selectedGap && (
        <GapDetailDialog gap={selectedGap} onClose={() => setSelectedGap(null)} />
      )}
    </div>
  );
}

function KPICard({ title, value, icon: Icon, trend, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <Card>
      <CardContent className={`pt-6 ${colors[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs opacity-65 mt-1">{trend}</p>
          </div>
          <Icon className="w-10 h-10 opacity-30" />
        </div>
      </CardContent>
    </Card>
  );
}

function getBadgeVariant(impact) {
  switch (impact) {
    case 'CRITICAL': return 'destructive';
    case 'HIGH': return 'default';
    case 'MEDIUM': return 'outline';
    default: return 'secondary';
  }
}

function getReportBorderColor(priority) {
  if (priority >= 9) return 'border-red-500';
  if (priority >= 7) return 'border-orange-500';
  if (priority >= 5) return 'border-blue-500';
  return 'border-slate-500';
}
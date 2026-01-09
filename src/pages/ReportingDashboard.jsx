import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, BarChart3, Download, Trash2 } from 'lucide-react';
import DashboardMetricsWidget from '@/components/reporting/DashboardMetricsWidget';
import ReportChartDisplay from '@/components/reporting/ReportChartDisplay';
import ReportBuilder from '@/components/reporting/ReportBuilder';

export default function ReportingDashboardPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: maintenanceTasks = [] } = useQuery({
    queryKey: ['maintenanceTasks'],
    queryFn: () => base44.entities.MaintenanceTask.list('-created_date', 100),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['tenantCommunications'],
    queryFn: () => base44.entities.TenantCommunication.list('-created_date', 100),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit?.list?.('-updated_date', 100).catch(() => []),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list('-updated_date', 100),
  });

  const { data: reportConfigs = [] } = useQuery({
    queryKey: ['reportConfigs'],
    queryFn: () => base44.entities.ReportConfig.list('-updated_date', 50),
  });

  const { data: reportData = null } = useQuery({
    queryKey: ['generatedReport', editingReport?.id],
    queryFn: async () => {
      if (!editingReport?.id) return null;
      const res = await base44.functions.invoke('generateReport', { reportId: editingReport.id });
      return res.data?.report;
    },
    enabled: !!editingReport?.id
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfigs'] });
      setShowBuilder(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfigs'] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async ({ reportData, format }) => {
      const res = await base44.functions.invoke('exportReport', { reportData, format });
      return res.data;
    },
  });

  // Calculate metrics
  const openTasks = maintenanceTasks.filter(t => t.status === 'open').length;
  const completedTasks = maintenanceTasks.filter(t => t.status === 'completed').length;
  const occupancy = units.length > 0 ? ((units.filter(u => u.status === 'occupied').length / units.length) * 100).toFixed(1) : 0;
  const communicationCount = communications.length;

  const handleExport = (format) => {
    if (reportData) {
      exportMutation.mutate({ reportData, format });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Reporting & Analysen</h1>
          <p className="text-slate-600 font-light mt-2">Erstellen Sie benutzerdefinierte Berichte und verfolgen Sie wichtige Kennzahlen</p>
        </div>
        <Button
          onClick={() => {
            setEditingReport(null);
            setShowBuilder(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Bericht
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="reports">
            Gespeicherte Berichte
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <DashboardMetricsWidget
              title="Offene Aufgaben"
              value={openTasks}
              icon={() => '📋'}
              color="red"
              trend={{ direction: openTasks > 0 ? 'negative' : 'positive', text: `${openTasks} offene Aufgaben` }}
            />
            <DashboardMetricsWidget
              title="Abgeschlossene Aufgaben"
              value={completedTasks}
              icon={() => '✅'}
              color="green"
              trend={{ direction: 'positive', text: `${completedTasks} erledigt` }}
            />
            <DashboardMetricsWidget
              title="Gebäudeauslastung"
              value={`${occupancy}%`}
              icon={() => '🏢'}
              color="blue"
              trend={{ direction: 'neutral', text: `${units.filter(u => u.status === 'occupied').length}/${units.length} Einheiten` }}
            />
            <DashboardMetricsWidget
              title="Kommunikationen"
              value={communicationCount}
              icon={() => '💬'}
              color="purple"
              trend={{ direction: 'positive', text: `${communicationCount} Nachrichten` }}
            />
          </div>

          {/* Key Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportChartDisplay
              type="bar"
              title="Wartungsaufgaben Status"
              data={[
                { name: 'Offen', value: maintenanceTasks.filter(t => t.status === 'open').length },
                { name: 'In Bearbeitung', value: maintenanceTasks.filter(t => t.status === 'in_progress').length },
                { name: 'Erledigt', value: maintenanceTasks.filter(t => t.status === 'completed').length }
              ]}
            />
            <ReportChartDisplay
              type="pie"
              title="Kommunikationstypen"
              data={[
                { name: 'Ankündigungen', value: communications.filter(c => c.communication_type === 'announcement').length },
                { name: 'Einzelnachrichten', value: communications.filter(c => c.communication_type === 'individual_message').length }
              ]}
            />
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 mt-6">
          {showBuilder ? (
            <ReportBuilder
              initialData={editingReport}
              onSave={(data) => {
                saveMutation.mutate(data);
              }}
            />
          ) : (
            <div className="space-y-2">
              {reportConfigs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600 font-light">Keine Berichte erstellt</p>
                </Card>
              ) : (
                reportConfigs.map(report => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-light text-slate-900">{report.name}</h3>
                        {report.description && <p className="text-sm font-light text-slate-600 mt-1">{report.description}</p>}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {report.report_type}
                          </span>
                          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                            {report.schedule}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingReport(report)}
                          className="font-light"
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Details */}
      {reportData && editingReport && (
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-light text-slate-900">{editingReport.name}</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-2 font-light"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                size="sm"
                onClick={() => handleExport('pdf')}
                className="gap-2 font-light"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card className="p-4">
            <h3 className="font-light text-slate-900 mb-3">Zusammenfassung</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-slate-600 font-light capitalize">{key}</p>
                  <p className="text-lg font-light text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reportData.charts.map((chart, idx) => (
              <ReportChartDisplay
                key={idx}
                type={chart.type}
                title={chart.title}
                data={chart.data}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, BarChart3 } from 'lucide-react';
import FinancialReportBuilder from '@/components/reporting/FinancialReportBuilder';
import FinancialReportViewer from '@/components/reporting/FinancialReportViewer';

export default function FinancialReporting() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['financialReports'],
    queryFn: async () => {
      try {
        return await base44.entities.FinancialReport.list('-generated_at', 10);
      } catch {
        return [];
      }
    }
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: async () => {
      try {
        return await base44.entities.ReportConfig.list('-created_at', 10);
      } catch {
        return [];
      }
    }
  });

  const handleReportGenerated = (report) => {
    setGeneratedReport(report);
    refetch();
  };

  if (showBuilder) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Button
            onClick={() => setShowBuilder(false)}
            variant="outline"
            className="mb-4"
          >
            ← Zurück
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Report erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialReportBuilder
              onReportGenerated={handleReportGenerated}
              onClose={() => setShowBuilder(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (generatedReport) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <Button
            onClick={() => setGeneratedReport(null)}
            variant="outline"
            className="mb-4"
          >
            ← Zurück
          </Button>
        </div>
        <FinancialReportViewer report={generatedReport} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">Finanzielle Berichterstattung</h1>
          <p className="text-slate-600 text-sm mt-1">
            KI-gestützte Berichte mit Insights, Trends und Empfehlungen
          </p>
        </div>
        <Button
          onClick={() => setShowBuilder(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Report
        </Button>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">Reports ({reports?.length || 0})</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen ({templates?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-3">
          {isLoading ? (
            <Card className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </Card>
          ) : reports && reports.length > 0 ? (
            reports.map(report => (
              <Card
                key={report.id}
                className="cursor-pointer hover:border-slate-400 transition-colors"
                onClick={() => setGeneratedReport(report)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{report.report_type} Bericht</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {report.period_start} bis {report.period_end}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {report.sections_included?.slice(0, 3).map(sec => (
                          <span key={sec} className="text-xs bg-slate-100 rounded px-2 py-1">{sec}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">
                        {new Date(report.generated_at).toLocaleDateString('de-DE')}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">{report.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 text-sm">Keine Reports vorhanden</p>
              <Button
                onClick={() => setShowBuilder(true)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ersten Report erstellen
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-3">
          {templatesLoading ? (
            <Card className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </Card>
          ) : templates && templates.length > 0 ? (
            templates.map(template => (
              <Card key={template.id} className="hover:border-slate-400 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{template.report_name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {template.frequency} | {template.sections_included?.length} Abschnitte
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Nutzen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600 text-sm">Keine Vorlagen vorhanden</p>
              <p className="text-xs text-slate-500 mt-1">
                Speichern Sie Report-Konfigurationen als Vorlagen für schnelle Wiederverwendung
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
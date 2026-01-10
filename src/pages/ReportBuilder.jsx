import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';
import ReportTemplates from '@/components/reporting/ReportTemplates';
import CustomReportBuilder from '@/components/reporting/CustomReportBuilder';
import ReportChartDisplay from '@/components/reporting/ReportChartDisplay';
import ReportsList from '@/components/reporting/ReportsList';

export default function ReportBuilder() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const generateReportMutation = useMutation({
    mutationFn: (params) =>
      base44.functions.invoke('generateCustomReport', params),
    onSuccess: (response) => {
      setReportData(response.data);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Berichte & Analysen
          </h1>
          <p className="text-slate-600 mt-2">Erstellen Sie benutzerdefinierte Berichte und analysieren Sie Ihre Daten</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="custom">Benutzerdefiniert</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <ReportTemplates
            onSelectTemplate={(template) => {
              setSelectedReport(template);
              generateReportMutation.mutate(template);
            }}
            isLoading={generateReportMutation.isPending}
          />
        </TabsContent>

        {/* Custom Builder Tab */}
        <TabsContent value="custom" className="space-y-6">
          <CustomReportBuilder
            onGenerateReport={(params) => {
              generateReportMutation.mutate(params);
            }}
            isLoading={generateReportMutation.isPending}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <ReportsList user={user} />
        </TabsContent>
      </Tabs>

      {/* Report Display */}
      {reportData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">{reportData.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                Drucken
              </Button>
            </div>
          </div>

          <ReportChartDisplay reportData={reportData} />
        </div>
      )}
    </div>
  );
}
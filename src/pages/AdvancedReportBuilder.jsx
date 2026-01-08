import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Mail, Calendar, BarChart3, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedReportBuilder() {
  const [reportType, setReportType] = useState('financial');
  const [format, setFormat] = useState('pdf');
  const [frequency, setFrequency] = useState('monthly');
  const [recipients, setRecipients] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => base44.entities.ReportSchedule.list()
  });

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      const response = await base44.functions.invoke('generateAdvancedReport', params);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Report generiert: ${data.file_name}`);
      }
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (params) => {
      await base44.entities.ReportSchedule.create({
        name: `${reportType} Report`,
        report_type: reportType,
        frequency,
        recipients: recipients.split(',').map(e => e.trim()),
        format,
        is_active: true,
        created_by: 'current_user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report-Zeitplan erstellt');
    }
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateMutation.mutateAsync({
        report_type: reportType,
        format,
        include_charts: true,
        include_tables: true
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!recipients.trim()) {
      toast.error('Bitte E-Mail-Adressen eingeben');
      return;
    }
    await scheduleMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Advanced Report Builder</h1>
        <p className="text-slate-600 mt-1">Erstelle, exportiere und zeitplane professionelle Reports</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Report generieren</TabsTrigger>
          <TabsTrigger value="schedule">Zeitplanung</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report-Konfiguration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Report-Typ</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Finanzbericht</SelectItem>
                      <SelectItem value="occupancy">Auslastungsbericht</SelectItem>
                      <SelectItem value="contracts">Vertragsbericht</SelectItem>
                      <SelectItem value="compliance">Compliance-Bericht</SelectItem>
                      <SelectItem value="tax">Steuerbericht</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Format</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="both">PDF + Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generiere...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generieren
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report zeitplanen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Häufigkeit</label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="quarterly">Quartalsweise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">E-Mail-Empfänger</label>
                  <input
                    type="text"
                    placeholder="email1@example.com, email2@example.com"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleSchedule}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Report zeitplanen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geplante Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Keine Reports geplant</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map(schedule => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-slate-600">{schedule.frequency} • {schedule.recipients.join(', ')}</p>
                      </div>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
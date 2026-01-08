import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Printer, Mail, Share2, 
  TrendingUp, PieChart, BarChart3, Calendar 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxReportingHub() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const reports = [
    {
      id: 'yearly-summary',
      title: 'Jahresübersicht',
      description: 'Komplette Übersicht aller Einnahmen, Ausgaben und Steuerrelevanten Daten',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 'tax-advisor',
      title: 'Steuerberater-Report',
      description: 'Alle relevanten Informationen für Ihren Steuerberater',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'income-analysis',
      title: 'Einnahmen-Analyse',
      description: 'Detaillierte Aufschlüsselung aller Mieteinnahmen',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'expense-breakdown',
      title: 'Ausgaben-Aufstellung',
      description: 'Kategorisierte Werbungskosten und Betriebsausgaben',
      icon: PieChart,
      color: 'red'
    },
    {
      id: 'afa-schedule',
      title: 'AfA-Plan',
      description: 'Abschreibungsplan für alle Gebäude und Anschaffungen',
      icon: BarChart3,
      color: 'yellow'
    },
    {
      id: 'compliance-report',
      title: 'Compliance-Bericht',
      description: 'GoBD-konformer Nachweis und Dokumentation',
      icon: FileText,
      color: 'slate'
    }
  ];

  const handleGenerateReport = async (reportId) => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateTaxReport', {
        report_type: reportId,
        year: selectedYear
      });

      // Download PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}-${selectedYear}.pdf`;
      a.click();

      toast.success('Report erfolgreich generiert');
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToAdvisor = async (reportId) => {
    try {
      await base44.functions.invoke('sendReportToAdvisor', {
        report_type: reportId,
        year: selectedYear
      });
      toast.success('Report an Steuerberater gesendet');
    } catch (error) {
      toast.error('Versand fehlgeschlagen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Steuer-Reporting & Berichte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Jahresauswahl */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Jahr:</span>
          <div className="flex gap-2">
            {[2024, 2023, 2022, 2021].map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="border-2 hover:border-slate-300 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-${report.color}-100`}>
                      <Icon className={`w-5 h-5 text-${report.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">{report.title}</div>
                      <div className="text-xs text-slate-600">{report.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={generating}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendToAdvisor(report.id)}
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Schnellaktionen</div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Share2 className="w-3 h-3 mr-1" />
              Alle teilen
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-3 h-3 mr-1" />
              Drucken
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3 h-3 mr-1" />
              Alle herunterladen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, TrendingUp, Users, Building2, Euro } from 'lucide-react';
import { toast } from 'sonner';
import ReportDateRangeSelector from '@/components/reports/ReportDateRangeSelector';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AutomatedReports() {
  const [generating, setGenerating] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const generateReport = async (reportType, exportFormat) => {
    setGenerating(`${reportType}_${exportFormat}`);
    try {
      const response = await base44.functions.invoke('generateAutomatedReport', {
        report_type: reportType,
        export_format: exportFormat,
        date_from: format(dateRange.from, 'yyyy-MM-dd'),
        date_to: format(dateRange.to, 'yyyy-MM-dd'),
        building_ids: buildings.map(b => b.id)
      });

      if (exportFormat === 'pdf') {
        const blob = new Blob([response.data.pdf_data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success('Report erstellt');
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(null);
    }
  };

  const reports = [
    {
      id: 'rent_roll',
      name: 'Mietübersicht (Rent Roll)',
      description: 'Vollständige Übersicht aller Mietverträge mit Einnahmen',
      icon: FileText,
      color: 'emerald'
    },
    {
      id: 'vacancy_report',
      name: 'Leerstandsbericht',
      description: 'Leerstandsquoten und -kosten nach Gebäude',
      icon: Building2,
      color: 'amber'
    },
    {
      id: 'outstanding_payments',
      name: 'Offene Zahlungen',
      description: 'Übersicht aller ausstehenden Mietzahlungen',
      icon: Euro,
      color: 'red'
    },
    {
      id: 'financial_summary',
      name: 'Finanzübersicht',
      description: 'Einnahmen, Ausgaben und Liquidität',
      icon: TrendingUp,
      color: 'blue'
    }
  ];

  const colorClasses = {
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50'
  };

  const iconColorClasses = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Automatisierte Berichte</h1>
        <p className="text-slate-600 mt-1">Generieren Sie Reports mit anpassbaren Zeiträumen</p>
      </div>

      {/* Date Range Selector */}
      <ReportDateRangeSelector
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => {
          const Icon = report.icon;
          const isGenerating = generating?.startsWith(report.id);

          return (
            <Card key={report.id} className={colorClasses[report.color]}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className={`w-6 h-6 ${iconColorClasses[report.color]}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateReport(report.id, 'pdf')}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {generating === `${report.id}_pdf` ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateReport(report.id, 'csv')}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {generating === `${report.id}_csv` ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full mr-2" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
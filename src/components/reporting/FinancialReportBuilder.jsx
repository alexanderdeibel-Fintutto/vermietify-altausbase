import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialReportBuilder({ onReportGenerated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [reportName, setReportName] = useState('Finanzberich');
  const [reportType, setReportType] = useState('monthly');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);

  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    income_analysis: true,
    expense_analysis: true,
    investment_report: false,
    crypto_analysis: false,
    trends: true,
    insights: true
  });

  const [selectedCharts, setSelectedCharts] = useState({
    line: true,
    pie: true,
    bar: true,
    area: false,
    sankey: false
  });

  const [frequency, setFrequency] = useState('one_time');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const response = await base44.functions.invoke('generateFinancialReport', {
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        include_sections: Object.keys(selectedSections).filter(k => selectedSections[k])
      });

      if (response.data.success) {
        toast.success('Bericht generiert');
        
        // Save as template if requested
        if (saveAsTemplate) {
          await base44.asServiceRole.entities.ReportConfig.create({
            user_email: (await base44.auth.me()).email,
            report_name: reportName,
            report_type: reportType,
            frequency,
            sections_included: Object.keys(selectedSections).filter(k => selectedSections[k]),
            chart_types: Object.keys(selectedCharts).filter(k => selectedCharts[k]),
            is_active: true,
            created_at: new Date().toISOString()
          }).catch(() => null);
        }

        onReportGenerated?.(response.data);
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'summary', label: 'Zusammenfassung', icon: '📊' },
    { id: 'income_analysis', label: 'Einkommensanalyse', icon: '📈' },
    { id: 'expense_analysis', label: 'Ausgabenanalyse', icon: '📉' },
    { id: 'investment_report', label: 'Investitionsbericht', icon: '💼' },
    { id: 'crypto_analysis', label: 'Kryptowerte', icon: '₿' },
    { id: 'trends', label: 'Trends & Prognosen', icon: '🔮' },
    { id: 'insights', label: 'KI-Insights', icon: '💡' }
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Grundlagen</TabsTrigger>
          <TabsTrigger value="sections">Abschnitte</TabsTrigger>
          <TabsTrigger value="charts">Visualisierungen</TabsTrigger>
          <TabsTrigger value="schedule">Zeitplan</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm">Report-Name</Label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="z.B. Januar 2026 Bericht"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Berichtstyp</Label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="annual">Jährlich</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Von</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Bis</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-3">
          {sections.map(section => (
            <Card key={section.id} className="cursor-pointer hover:border-slate-300" onClick={() => {
              setSelectedSections(prev => ({...prev, [section.id]: !prev[section.id]}));
            }}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Checkbox
                  checked={selectedSections[section.id]}
                  onCheckedChange={() => {
                    setSelectedSections(prev => ({...prev, [section.id]: !prev[section.id]}));
                  }}
                />
                <span className="text-lg">{section.icon}</span>
                <Label className="font-medium cursor-pointer flex-1">{section.label}</Label>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-3">
          <p className="text-xs text-slate-600 mb-3">Wählen Sie die gewünschten Charttypen</p>
          {Object.keys(selectedCharts).map(chart => (
            <Card key={chart} className="cursor-pointer hover:border-slate-300" onClick={() => {
              setSelectedCharts(prev => ({...prev, [chart]: !prev[chart]}));
            }}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Checkbox
                  checked={selectedCharts[chart]}
                  onCheckedChange={() => {
                    setSelectedCharts(prev => ({...prev, [chart]: !prev[chart]}));
                  }}
                />
                <Label className="font-medium cursor-pointer flex-1 capitalize">{chart}</Label>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm">Häufigkeit</Label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="one_time">Einmalig</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="annual">Jährlich</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <Checkbox
                  id="saveTemplate"
                  checked={saveAsTemplate}
                  onCheckedChange={setSaveAsTemplate}
                />
                <Label htmlFor="saveTemplate" className="text-sm cursor-pointer">
                  Als Vorlage speichern für wiederkehrende Reports
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird generiert...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Vorschau generieren
            </>
          )}
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Abbrechen
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
        <p className="font-semibold mb-2">Konfiguration:</p>
        <div className="space-y-1">
          <p>• Berichtstyp: <Badge variant="outline" className="ml-1">{reportType}</Badge></p>
          <p>• Zeitraum: {periodStart} bis {periodEnd}</p>
          <p>• Abschnitte: {Object.values(selectedSections).filter(Boolean).length} ausgewählt</p>
          <p>• Charts: {Object.values(selectedCharts).filter(Boolean).length} ausgewählt</p>
        </div>
      </div>
    </div>
  );
}
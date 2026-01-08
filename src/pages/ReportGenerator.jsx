import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, BarChart3, Download } from 'lucide-react';

export default function ReportGeneratorPage() {
  const [reportType, setReportType] = useState('financial');
  const [timeframe, setTimeframe] = useState('month');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'costs']);

  const metrics = {
    financial: ['Einnahmen', 'Ausgaben', 'Nettowert', 'Cashflow', 'ROI'],
    occupancy: ['Belegungsquote', 'Leerstände', 'Durchschnittliche Mietdauer', 'Fluktuation'],
    tenant: ['Mieteranzahl', 'Zahlungsquote', 'Rückstände', 'Churn Rate'],
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📊 Report Generator</h1>
          <p className="text-slate-600 mt-1">Erstellen Sie benutzerdefinierte Reports</p>
        </div>
        <Button className="bg-lime-600 hover:bg-lime-700"><Download className="w-4 h-4 mr-2" />Report erstellen</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Report Typ</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Finanzbericht</SelectItem>
                  <SelectItem value="occupancy">Belegungsbericht</SelectItem>
                  <SelectItem value="tenant">Mieterbericht</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Zeitraum</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Diese Woche</SelectItem>
                  <SelectItem value="month">Diesen Monat</SelectItem>
                  <SelectItem value="quarter">Dieses Quartal</SelectItem>
                  <SelectItem value="year">Dieses Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Metriken auswählen</label>
            <div className="space-y-2">
              {metrics[reportType]?.map((metric, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                  <Checkbox 
                    checked={selectedMetrics.includes(metric)}
                    onCheckedChange={() => toggleMetric(metric)}
                  />
                  <label className="text-sm text-slate-700 cursor-pointer flex-1">{metric}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline">PDF Export</Button>
            <Button variant="outline">Excel Export</Button>
            <Button className="bg-lime-600 hover:bg-lime-700">Vorschau</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Letzte Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {['Finanzbericht Januar 2026', 'Belegungsbericht Q4 2025', 'Mieterbericht Dezember 2025'].map((report, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-900">{report}</span>
              <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
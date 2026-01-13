import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, LineChart as LineChartIcon, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const REPORT_METRICS = {
  financial: ['Gesamteinnahmen', 'Gesamtausgaben', 'Nettomarge', 'ROI'],
  occupancy: ['Belegungsquote', 'Freie Einheiten', 'Mieten ausstehend'],
  maintenance: ['Offene Tasks', 'Durchschnittliche Dauer', 'Kosten'],
  tenant: ['Anzahl Mieter', 'Zahlungsmoral', 'Vertragsdauer']
};

const CHART_TYPES = [
  { id: 'bar', label: '📊 Balkendiagramm', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'line', label: '📈 Liniendiagramm', icon: <LineChartIcon className="w-4 h-4" /> },
  { id: 'pie', label: '🥧 Tortendiagramm' },
  { id: 'table', label: '📋 Tabelle' }
];

export default function CustomReportBuilder({ open, onOpenChange }) {
  const [name, setName] = useState('');
  const [reportType, setReportType] = useState('financial');
  const [selectedMetrics, setSelectedMetrics] = useState(['Gesamteinnahmen']);
  const [chartType, setChartType] = useState('bar');
  const [dateRange, setDateRange] = useState('monthly');

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Call backend to generate report
      const response = await base44.functions.invoke('generateAdvancedReport', {
        name: name,
        type: reportType,
        metrics: selectedMetrics,
        chartType: chartType,
        dateRange: dateRange
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('📊 Report erstellt');
      handleReset();
      onOpenChange(false);
    },
    onError: () => toast.error('Fehler beim Erstellen')
  });

  const handleToggleMetric = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const handleReset = () => {
    setName('');
    setReportType('financial');
    setSelectedMetrics(['Gesamteinnahmen']);
    setChartType('bar');
    setDateRange('monthly');
  };

  const isValid = name && selectedMetrics.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Benutzerdefinierten Report erstellen</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Report Name */}
          <div className="col-span-2">
            <label className="text-sm font-medium">Report-Name</label>
            <Input
              placeholder="z.B. 'Quartalsübersicht'"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="text-sm font-medium">Typ</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">💰 Finanzen</SelectItem>
                <SelectItem value="occupancy">🏠 Belegung</SelectItem>
                <SelectItem value="maintenance">🔧 Wartung</SelectItem>
                <SelectItem value="tenant">👥 Mieter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type */}
          <div>
            <label className="text-sm font-medium">Diagrammtyp</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(ct => (
                  <SelectItem key={ct.id} value={ct.id}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium">Zeitraum</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Diese Woche</SelectItem>
                <SelectItem value="monthly">Diesen Monat</SelectItem>
                <SelectItem value="quarterly">Dieses Quartal</SelectItem>
                <SelectItem value="yearly">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Selection */}
          <div className="col-span-2">
            <label className="text-sm font-medium mb-2 block">Metriken</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_METRICS[reportType]?.map(metric => (
                <label key={metric} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <Checkbox
                    checked={selectedMetrics.includes(metric)}
                    onCheckedChange={() => handleToggleMetric(metric)}
                  />
                  <span className="text-sm">{metric}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!isValid || generateMutation.isPending}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {generateMutation.isPending ? 'Generiere...' : 'Report generieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
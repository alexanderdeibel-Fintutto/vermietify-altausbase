import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

const entities = [
  { value: 'FinancialItem', label: 'Finanzielle Positionen' },
  { value: 'BuildingTask', label: 'Aufgaben' },
  { value: 'Unit', label: 'Einheiten' },
  { value: 'Tenant', label: 'Mieter' },
  { value: 'Payment', label: 'Zahlungen' },
  { value: 'Building', label: 'Gebäude' },
  { value: 'LeaseContract', label: 'Mietverträge' }
];

const metricsByEntity = {
  FinancialItem: ['amount', 'category', 'date', 'created_by'],
  BuildingTask: ['status', 'priority', 'due_date', 'assigned_to'],
  Unit: ['occupancy_status', 'rent_amount', 'building_id'],
  Tenant: ['move_in_date', 'status', 'email'],
  Payment: ['amount', 'date', 'status', 'tenant_id'],
  Building: ['address', 'units_count', 'created_date'],
  LeaseContract: ['start_date', 'end_date', 'monthly_rent', 'tenant_id']
};

export default function CustomReportBuilder({ onGenerateReport, isLoading }) {
  const [reportName, setReportName] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('FinancialItem');
  const [selectedMetrics, setSelectedMetrics] = useState(['amount']);
  const [groupBy, setGroupBy] = useState('date');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentMetrics = metricsByEntity[selectedEntity] || [];

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleGenerateReport = () => {
    if (!reportName) {
      alert('Bitte geben Sie einen Namen für den Bericht ein');
      return;
    }

    onGenerateReport({
      title: reportName,
      entity: selectedEntity,
      metrics: selectedMetrics,
      groupBy,
      period,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benutzerdefinierten Bericht erstellen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Report Name */}
          <div>
            <Label htmlFor="report-name" className="text-sm font-medium text-slate-700 mb-2 block">
              Berichtname
            </Label>
            <Input
              id="report-name"
              placeholder="z.B. Quartalsbericht Q4 2025"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          {/* Entity Selection */}
          <div>
            <Label htmlFor="entity" className="text-sm font-medium text-slate-700 mb-2 block">
              Datenquelle
            </Label>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger id="entity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entities.map(entity => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              Metriken (Mindestens 1 erforderlich)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentMetrics.map(metric => (
                <div key={metric} className="flex items-center gap-2">
                  <Checkbox
                    id={metric}
                    checked={selectedMetrics.includes(metric)}
                    onCheckedChange={() => handleMetricToggle(metric)}
                  />
                  <label
                    htmlFor={metric}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {metric.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
            {selectedMetrics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMetrics.map(metric => (
                  <Badge key={metric} variant="secondary" className="text-xs">
                    {metric.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Grouping and Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="groupby" className="text-sm font-medium text-slate-700 mb-2 block">
                Gruppieren nach
              </Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger id="groupby">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Datum</SelectItem>
                  <SelectItem value="category">Kategorie</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="building">Gebäude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period" className="text-sm font-medium text-slate-700 mb-2 block">
                Zeitraum
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium text-slate-700 mb-2 block">
                Startdatum (Optional)
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="text-sm font-medium text-slate-700 mb-2 block">
                Enddatum (Optional)
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full"
            onClick={handleGenerateReport}
            disabled={isLoading || selectedMetrics.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Bericht generieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
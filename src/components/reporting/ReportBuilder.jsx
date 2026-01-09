import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const reportTypes = {
  rent_income: { name: 'Mieteingänge', icon: '💰' },
  maintenance_history: { name: 'Wartungshistorie', icon: '🔧' },
  tenant_overview: { name: 'Mietüberblick', icon: '👥' },
  building_occupancy: { name: 'Gebäudeauslastung', icon: '🏢' },
  financial_summary: { name: 'Finanzzusammenfassung', icon: '📊' },
  communication_log: { name: 'Kommunikationslog', icon: '💬' },
  equipment_status: { name: 'Gerätestatus', icon: '⚙️' },
  custom: { name: 'Benutzerdefiniert', icon: '✨' }
};

const chartOptions = ['line', 'bar', 'pie', 'area', 'table'];
const groupingOptions = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
  yearly: 'Jährlich',
  by_building: 'Nach Gebäude',
  by_tenant: 'Nach Mieter',
  none: 'Keine Gruppierung'
};

export default function ReportBuilder({ onSave, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    report_type: 'custom',
    grouping: 'monthly',
    chart_types: [],
    schedule: 'manual',
    metrics: [],
    filters: {}
  });

  const handleChartToggle = (chart) => {
    setFormData(prev => ({
      ...prev,
      chart_types: prev.chart_types.includes(chart)
        ? prev.chart_types.filter(c => c !== chart)
        : [...prev.chart_types, chart]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-light text-slate-900">Grundinformationen</h3>
          
          <div>
            <label className="text-sm font-light text-slate-700">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Monatliche Mieteingänge"
              className="mt-1 font-light"
              required
            />
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optionale Beschreibung..."
              className="mt-1 font-light"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Berichtstyp *</label>
            <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypes).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.icon} {val.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-lg font-light text-slate-900">Anzeigeoptionen</h3>

          <div>
            <label className="text-sm font-light text-slate-700">Diagrammtypen</label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-2">
              {chartOptions.map(chart => (
                <label key={chart} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.chart_types.includes(chart)}
                    onCheckedChange={() => handleChartToggle(chart)}
                  />
                  <span className="text-sm font-light text-slate-700 capitalize">{chart}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Gruppierung</label>
            <Select value={formData.grouping} onValueChange={(value) => setFormData({ ...formData, grouping: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupingOptions).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-lg font-light text-slate-900">Zeitplan</h3>
          
          <div>
            <label className="text-sm font-light text-slate-700">Generierungsplan</label>
            <Select value={formData.schedule} onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">📋 Manuell</SelectItem>
                <SelectItem value="daily">📅 Täglich</SelectItem>
                <SelectItem value="weekly">📅 Wöchentlich</SelectItem>
                <SelectItem value="monthly">📅 Monatlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-slate-200 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-light"
          >
            {initialData ? 'Aktualisieren' : 'Bericht erstellen'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
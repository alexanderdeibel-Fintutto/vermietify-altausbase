import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomReportBuilder() {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    entity: 'Building',
    fields: [],
    filters: [],
    groupBy: '',
    sortBy: '',
    format: 'pdf'
  });

  const entityFields = {
    Building: ['name', 'address', 'city', 'total_units', 'year_built', 'total_area'],
    Tenant: ['first_name', 'last_name', 'email', 'phone', 'move_in_date', 'status'],
    LeaseContract: ['start_date', 'end_date', 'base_rent', 'total_rent', 'deposit', 'status'],
    Payment: ['amount', 'due_date', 'paid_date', 'status', 'payment_method'],
    Document: ['name', 'category', 'status', 'created_date', 'ai_category']
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateCustomReport', reportConfig);
      return response.data;
    },
    onSuccess: (data) => {
      if (reportConfig.format === 'pdf') {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `${reportConfig.name}.pdf`;
        link.click();
      }
      toast.success('Report generiert');
    }
  });

  const toggleField = (field) => {
    setReportConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }));
  };

  const addFilter = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: 'equals', value: '' }]
    }));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Konfiguration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Report Name</label>
              <Input
                value={reportConfig.name}
                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                placeholder="z.B. Monatlicher Gebäude-Report"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Entität</label>
              <Select
                value={reportConfig.entity}
                onValueChange={(value) => setReportConfig({ ...reportConfig, entity: value, fields: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Building">Gebäude</SelectItem>
                  <SelectItem value="Tenant">Mieter</SelectItem>
                  <SelectItem value="LeaseContract">Verträge</SelectItem>
                  <SelectItem value="Payment">Zahlungen</SelectItem>
                  <SelectItem value="Document">Dokumente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Felder auswählen</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entityFields[reportConfig.entity].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Checkbox
                      checked={reportConfig.fields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <label className="text-sm">{field}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-semibold">Gruppieren nach</label>
                <Select
                  value={reportConfig.groupBy}
                  onValueChange={(value) => setReportConfig({ ...reportConfig, groupBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine</SelectItem>
                    {entityFields[reportConfig.entity].map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold">Sortieren nach</label>
                <Select
                  value={reportConfig.sortBy}
                  onValueChange={(value) => setReportConfig({ ...reportConfig, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Standard</SelectItem>
                    {entityFields[reportConfig.entity].map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Format</label>
              <Select
                value={reportConfig.format}
                onValueChange={(value) => setReportConfig({ ...reportConfig, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter</CardTitle>
              <Button onClick={addFilter} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportConfig.filters.map((filter, idx) => (
              <div key={idx} className="flex gap-2 p-2 bg-slate-50 rounded">
                <Select
                  value={filter.field}
                  onValueChange={(value) => {
                    const updated = [...reportConfig.filters];
                    updated[idx].field = value;
                    setReportConfig({ ...reportConfig, filters: updated });
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Feld" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityFields[reportConfig.entity].map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(value) => {
                    const updated = [...reportConfig.filters];
                    updated[idx].operator = value;
                    setReportConfig({ ...reportConfig, filters: updated });
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Gleich</SelectItem>
                    <SelectItem value="contains">Enthält</SelectItem>
                    <SelectItem value="greater_than">Größer</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Wert"
                  value={filter.value}
                  onChange={(e) => {
                    const updated = [...reportConfig.filters];
                    updated[idx].value = e.target.value;
                    setReportConfig({ ...reportConfig, filters: updated });
                  }}
                  className="flex-1"
                />

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setReportConfig({
                      ...reportConfig,
                      filters: reportConfig.filters.filter((_, i) => i !== idx)
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {reportConfig.filters.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-2">Keine Filter</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-none">
          <CardHeader>
            <CardTitle>Report Vorschau</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Name:</p>
              <p className="text-lg">{reportConfig.name || 'Unbenannt'}</p>
            </div>

            <div>
              <p className="text-sm font-semibold">Datenquelle:</p>
              <Badge>{reportConfig.entity}</Badge>
            </div>

            <div>
              <p className="text-sm font-semibold">Ausgewählte Felder:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {reportConfig.fields.map(field => (
                  <Badge key={field} variant="outline">{field}</Badge>
                ))}
                {reportConfig.fields.length === 0 && (
                  <p className="text-xs text-slate-600">Keine Felder ausgewählt</p>
                )}
              </div>
            </div>

            {reportConfig.filters.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Aktive Filter:</p>
                <p className="text-xs text-slate-600">{reportConfig.filters.length} Filter(n)</p>
              </div>
            )}

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!reportConfig.name || reportConfig.fields.length === 0 || generateMutation.isPending}
              className="w-full mt-4"
            >
              <Download className="w-4 h-4 mr-2" />
              {generateMutation.isPending ? 'Generiere...' : 'Report generieren'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Häufige Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setReportConfig({
                name: 'Alle Gebäude mit Kennzahlen',
                entity: 'Building',
                fields: ['name', 'address', 'city', 'total_units', 'total_area'],
                filters: [],
                groupBy: 'city',
                sortBy: 'name',
                format: 'pdf'
              })}
            >
              Gebäude-Übersicht
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setReportConfig({
                name: 'Aktive Mietverträge',
                entity: 'LeaseContract',
                fields: ['start_date', 'end_date', 'base_rent', 'total_rent', 'status'],
                filters: [{ field: 'status', operator: 'equals', value: 'active' }],
                groupBy: '',
                sortBy: 'start_date',
                format: 'excel'
              })}
            >
              Aktive Verträge
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setReportConfig({
                name: 'Mieter-Kontaktliste',
                entity: 'Tenant',
                fields: ['first_name', 'last_name', 'email', 'phone', 'status'],
                filters: [{ field: 'status', operator: 'equals', value: 'active' }],
                groupBy: '',
                sortBy: 'last_name',
                format: 'csv'
              })}
            >
              Mieter-Kontakte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
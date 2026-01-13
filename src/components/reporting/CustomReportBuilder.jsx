import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const REPORT_TEMPLATES = {
  financial: {
    name: 'Finanzbericht',
    icon: '💰',
    sections: ['summary', 'cashflow', 'expenses', 'revenue']
  },
  operational: {
    name: 'Operativer Bericht',
    icon: '⚙️',
    sections: ['kpis', 'tasks', 'delays', 'efficiency']
  },
  tenant: {
    name: 'Mieterbericht',
    icon: '👥',
    sections: ['occupancy', 'payments', 'contracts', 'issues']
  },
  property: {
    name: 'Immobilienbericht',
    icon: '🏢',
    sections: ['valuation', 'maintenance', 'roi', 'risk']
  }
};

const EXPORT_FORMATS = ['PDF', 'Excel', 'CSV', 'Email'];

export default function CustomReportBuilder({ open, onOpenChange }) {
  const [template, setTemplate] = useState('financial');
  const [reportName, setReportName] = useState('');
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [exportFormat, setExportFormat] = useState('PDF');
  const [schedule, setSchedule] = useState('');
  const queryClient = useQueryClient();

  const buildMutation = useMutation({
    mutationFn: async () => {
      const sections = Array.from(selectedSections);
      const response = await base44.functions.invoke('generateCustomReport', {
        template: template,
        sections: sections,
        format: exportFormat,
        name: reportName,
        schedule: schedule
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(`✅ Bericht "${reportName}" erstellt`);
      queryClient.invalidateQueries();
      handleReset();
      onOpenChange(false);
    }
  });

  const handleReset = () => {
    setTemplate('financial');
    setReportName('');
    setSelectedSections(new Set());
    setExportFormat('PDF');
    setSchedule('');
  };

  const toggleSection = (section) => {
    const updated = new Set(selectedSections);
    if (updated.has(section)) {
      updated.delete(section);
    } else {
      updated.add(section);
    }
    setSelectedSections(updated);
  };

  const currentTemplate = REPORT_TEMPLATES[template];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Name */}
          <div>
            <label className="text-sm font-medium">Report-Name</label>
            <Input
              placeholder="z.B. Quartalsfinanzbericht 2026"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium">Template</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(REPORT_TEMPLATES).map(([key, value]) => (
                <Card
                  key={key}
                  onClick={() => {
                    setTemplate(key);
                    setSelectedSections(new Set());
                  }}
                  className={`cursor-pointer border-2 ${
                    template === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl">{value.icon}</p>
                    <p className="text-xs font-medium mt-1">{value.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <label className="text-sm font-medium">Abschnitte</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {currentTemplate.sections.map(section => (
                <label key={section} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedSections.has(section)}
                    onCheckedChange={() => toggleSection(section)}
                  />
                  <span className="text-sm capitalize">{section.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="text-sm font-medium">Exportformat</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(fmt => (
                  <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-sm font-medium">Zeitplan (optional)</label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Einmalig / Automatisch?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Einmalig</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="quarterly">Vierteljährlich</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              variant="outline"
              onClick={() => {/* Preview */}}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Vorschau
            </Button>
            <Button
              onClick={() => buildMutation.mutate()}
              disabled={!reportName || selectedSections.size === 0 || buildMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {buildMutation.isPending ? 'Erstelle...' : 'Report erstellen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
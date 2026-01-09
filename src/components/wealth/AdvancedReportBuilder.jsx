import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const REPORT_SECTIONS = [
  { id: 'summary', label: 'Portfolio-Übersicht', selected: true },
  { id: 'allocation', label: 'Vermögensverteilung', selected: true },
  { id: 'performance', label: 'Performance-Analyse', selected: true },
  { id: 'tax', label: 'Steuerliche Übersicht', selected: true },
  { id: 'recommendations', label: 'AI-Empfehlungen', selected: false },
  { id: 'benchmark', label: 'Benchmark-Vergleich', selected: false }
];

export default function AdvancedReportBuilder({ portfolioId, userId, open, onOpenChange }) {
  const [format, setFormat] = useState('pdf');
  const [sections, setSections] = useState(REPORT_SECTIONS);
  const [audience, setAudience] = useState('personal'); // personal, advisor, tax_authority

  const generateMutation = useMutation({
    mutationFn: async () => {
      const selectedSections = sections.filter(s => s.selected).map(s => s.id);
      
      const response = await base44.functions.invoke('generateAdvancedReport', {
        portfolioId,
        userId,
        format,
        sections: selectedSections,
        audience,
        includePersonalData: audience === 'personal',
        includeAdvisorNotes: audience === 'advisor'
      });

      return response;
    },
    onSuccess: (data) => {
      if (data.file_url) {
        window.open(data.file_url, '_blank');
        toast.success('Report erstellt und heruntergeladen!');
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const toggleSection = (id) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report-Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['pdf', 'excel', 'elster'].map(fmt => (
                <Card
                  key={fmt}
                  className={`cursor-pointer transition-all ${
                    format === fmt ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                  onClick={() => setFormat(fmt)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-medium capitalize">{fmt}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {fmt === 'pdf' && 'Professioneller Report'}
                      {fmt === 'excel' && 'Für Tabellenkalkulation'}
                      {fmt === 'elster' && 'Steuererklärung'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Audience Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Zielgruppe</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Persönliche Kopie</SelectItem>
                <SelectItem value="advisor">Für Steuerberater</SelectItem>
                <SelectItem value="tax_authority">Steuerbehörde</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sections Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Abschnitte</Label>
            <div className="space-y-2">
              {sections.map(section => (
                <Card key={section.id} className="p-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={section.id}
                      checked={section.selected}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Label htmlFor={section.id} className="cursor-pointer flex-1">
                      {section.label}
                    </Label>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird generiert...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Report erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
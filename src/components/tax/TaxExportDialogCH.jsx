import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CANTONS = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];

export default function TaxExportDialogCH({ open, onOpenChange, taxYear }) {
  const [canton, setCanton] = useState('ZH');
  const [selectedFormats, setSelectedFormats] = useState({
    pdf_wertschriften: false,
    pdf_immobilien: false,
    xml_etax: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      id: 'pdf_wertschriften',
      name: 'Wertschriftenverzeichnis (PDF)',
      description: 'Alle Aktien, Fonds, Anleihen und deren Erträge',
      icon: '📊'
    },
    {
      id: 'pdf_immobilien',
      name: 'Liegenschaftenverzeichnis (PDF)',
      description: 'Alle Immobilien und Mieteinnahmen',
      icon: '🏠'
    },
    {
      id: 'xml_etax',
      name: 'eTax/TaxMe XML',
      description: 'Für elektronische Steuererklärung im Kanton',
      icon: '🔗'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const selectedIds = Object.keys(selectedFormats).filter(k => selectedFormats[k]);

      if (selectedIds.length === 0) {
        toast.error('Bitte wählen Sie mindestens ein Format aus');
        setIsExporting(false);
        return;
      }

      // Generate eTax XML
      if (selectedFormats.xml_etax) {
        const { data } = await base44.functions.invoke('generateETaxXML', { taxYear, canton });
        toast.success(`✅ eTax XML für ${canton} generiert`);
        window.open(data.file_url, '_blank');
      }

      // Generate PDFs
      for (const id of selectedIds.filter(id => id.startsWith('pdf_'))) {
        const formName = id.replace('pdf_', '').charAt(0).toUpperCase() + id.replace('pdf_', '').slice(1);
        try {
          const { data } = await base44.functions.invoke(`generatePDFAnlageCH${formName}`, { taxYear, canton });
          toast.success(`✅ ${formName} PDF generiert`);
          window.open(data.file_url, '_blank');
        } catch (error) {
          console.warn(`PDF-Generierung für ${formName} nicht verfügbar`);
        }
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(`Exportfehler: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Steuererklärung Exportieren - Schweiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kanton</label>
            <Select value={canton} onValueChange={setCanton}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANTONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-slate-600">
            Wählen Sie die Formate aus. Steuerjahr: {taxYear} | Kanton: {canton}
          </p>

          <div className="space-y-2">
            {formats.map((format) => (
              <Card
                key={format.id}
                className={`cursor-pointer transition-all ${
                  selectedFormats[format.id]
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() =>
                  setSelectedFormats({
                    ...selectedFormats,
                    [format.id]: !selectedFormats[format.id]
                  })
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedFormats[format.id]}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{format.icon}</span>
                        <h3 className="font-bold">{format.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{format.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              💡 <strong>Tipp:</strong> Die eTax/TaxMe-XML kann direkt beim Kantonalen Steueramt
              eingereicht werden.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Exportiert...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Exportieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
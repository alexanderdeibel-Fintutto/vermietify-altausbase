import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxExportDialogAT({ open, onOpenChange, taxYear }) {
  const [selectedFormats, setSelectedFormats] = useState({
    pdf_anlage_kap: false,
    pdf_anlage_so: false,
    pdf_anlage_e1c: false,
    xml_finanzOnline: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      id: 'pdf_anlage_kap',
      name: 'Anlage KAP (PDF)',
      description: 'Kapitalvermögen - Einkünfte aus Kapitalanlage',
      icon: '📄'
    },
    {
      id: 'pdf_anlage_so',
      name: 'Anlage SO (PDF)',
      description: 'Sonstige Einkünfte',
      icon: '📋'
    },
    {
      id: 'pdf_anlage_e1c',
      name: 'Anlage E1c (PDF)',
      description: 'Vermietung & Verpachtung',
      icon: '🏠'
    },
    {
      id: 'xml_finanzOnline',
      name: 'FINANZOnline XML',
      description: 'Für elektronische Übermittlung via FINANZOnline',
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

      // Generate FINANZOnline XML
      if (selectedFormats.xml_finanzOnline) {
        const { data } = await base44.functions.invoke('generateFINANZOnlineXML', { taxYear });
        toast.success(`✅ FINANZOnline XML generiert: ${data.fileName}`);
        // Download XML
        window.open(data.file_url, '_blank');
      }

      // Generate PDFs
      for (const id of selectedIds.filter(id => id.startsWith('pdf_'))) {
        const formName = id.replace('pdf_', '').toUpperCase();
        try {
          const { data } = await base44.functions.invoke(`generatePDFAnlageAT${formName}`, { taxYear });
          toast.success(`✅ ${formName} PDF generiert`);
          window.open(data.file_url, '_blank');
        } catch (error) {
          toast.error(`Fehler bei ${formName}: ${error.message}`);
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
          <DialogTitle>Steuererklärung Exportieren - Österreich</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Wählen Sie die Formate aus, die Sie exportieren möchten. Steuerjahr: {taxYear}
          </p>

          <div className="space-y-2">
            {formats.map((format) => (
              <Card
                key={format.id}
                className={`cursor-pointer transition-all ${
                  selectedFormats[format.id]
                    ? 'border-blue-500 bg-blue-50'
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

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> FINANZOnline XML ermöglicht die sichere elektronische Übermittlung
              an die österreichischen Finanzbehörden.
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
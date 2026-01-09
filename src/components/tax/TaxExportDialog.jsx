import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxExportDialog({ open, onOpenChange, taxYear }) {
  const [formats, setFormats] = useState(['xml']);

  const { data: validation } = useQuery({
    queryKey: ['taxValidation', taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      const res = await base44.functions.invoke('validateTaxData', {
        userId: user.id,
        taxYear
      });
      return res;
    },
    enabled: open
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return await base44.functions.invoke('batchTaxExport', {
        userId: user.id,
        taxYear,
        formats
      });
    },
    onSuccess: (data) => {
      toast.success(`${data.exports.length} Dateien erfolgreich erstellt`);
      // Open first file
      if (data.exports.length > 0) {
        window.open(data.exports[0].file_url, '_blank');
      }
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const handleToggleFormat = (format) => {
    if (formats.includes(format)) {
      setFormats(formats.filter(f => f !== format));
    } else {
      setFormats([...formats, format]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Steuererklärung {taxYear}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Status */}
          {validation && (
            <Alert className={validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {validation.isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>
                {validation.isValid ? 'Daten validiert' : 'Validierungsfehler'}
              </AlertTitle>
              <AlertDescription>
                {validation.isValid ? (
                  <div>
                    <p>Alle erforderlichen Daten sind vorhanden:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• {validation.summary.investmentsCount} Investments (Anlage KAP)</li>
                      <li>• {validation.summary.otherIncomesCount} Sonstige Einkünfte (Anlage SO)</li>
                      <li>• {validation.summary.capitalGainsCount} Veräußerungsgeschäfte (Anlage VG)</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-2">Fehler:</p>
                    <ul className="text-sm space-y-1">
                      {validation.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {validation?.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Warnungen</AlertTitle>
              <AlertDescription>
                <ul className="text-sm space-y-1">
                  {validation.warnings.map((warn, i) => (
                    <li key={i}>⚠️ {warn}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Formats */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Exportformate</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 border rounded hover:bg-slate-50">
                <Checkbox
                  id="format-xml"
                  checked={formats.includes('xml')}
                  onCheckedChange={() => handleToggleFormat('xml')}
                />
                <Label htmlFor="format-xml" className="flex-1 cursor-pointer">
                  <div className="font-medium">ELSTER-XML</div>
                  <div className="text-xs text-slate-500">Für Steuererklärung (ERiC)</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded hover:bg-slate-50">
                <Checkbox
                  id="format-pdf"
                  checked={formats.includes('pdf')}
                  onCheckedChange={() => handleToggleFormat('pdf')}
                  disabled
                />
                <Label htmlFor="format-pdf" className="flex-1 cursor-pointer opacity-50">
                  <div className="font-medium">PDF-Anlagen</div>
                  <div className="text-xs text-slate-500">Druckbare BMF-Formulare (Demnächst)</div>
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || !validation?.isValid || formats.length === 0}
              className="gap-2"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportieren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
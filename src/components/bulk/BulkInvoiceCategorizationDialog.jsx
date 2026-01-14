import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkInvoiceCategorizationDialog({ open, onOpenChange, selectedInvoices, onSuccess }) {
  const [selectedCostTypeId, setSelectedCostTypeId] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [costTypes, setCostTypes] = useState([]);

  React.useEffect(() => {
    if (open) {
      base44.entities.CostType.list().then(setCostTypes);
    }
  }, [open]);

  const handleBulkCategorize = async () => {
    if (!useAI && !selectedCostTypeId) {
      toast.error('Bitte wählen Sie eine Kostenart oder nutzen Sie KI');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const total = selectedInvoices.length;
      
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoice = selectedInvoices[i];
        let costTypeId = selectedCostTypeId;

        if (useAI) {
          // AI suggestion for each invoice
          try {
            const response = await base44.integrations.Core.InvokeLLM({
              prompt: `Kategorisiere diese Rechnung: "${invoice.description}" von "${invoice.recipient}". Verfügbare Kostenarten: ${costTypes.map(ct => `${ct.id}:${ct.main_category}/${ct.sub_category}`).join(', ')}. Gib nur die ID zurück.`,
              response_json_schema: {
                type: 'object',
                properties: {
                  cost_type_id: { type: 'string' }
                }
              }
            });
            costTypeId = response.cost_type_id || selectedCostTypeId;
          } catch (error) {
            console.error('AI categorization failed:', error);
            costTypeId = selectedCostTypeId;
          }
        }

        if (costTypeId) {
          await base44.entities.Invoice.update(invoice.id, { cost_type_id: costTypeId });
        }

        setProgress(((i + 1) / total) * 100);
      }

      toast.success(`${total} Rechnungen kategorisiert`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk categorization error:', error);
      toast.error('Fehler beim Kategorisieren');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk-Kategorisierung</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>{selectedInvoices.length}</strong> Rechnungen ausgewählt
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-ai" 
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="use-ai" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-4 h-4 text-purple-500" />
              KI-gestützte Kategorisierung
            </Label>
          </div>

          {!useAI && (
            <div>
              <Label>Kostenart (für alle)</Label>
              <Select value={selectedCostTypeId} onValueChange={setSelectedCostTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kostenart wählen..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(
                    costTypes.reduce((acc, ct) => {
                      if (!acc[ct.main_category]) acc[ct.main_category] = [];
                      acc[ct.main_category].push(ct);
                      return acc;
                    }, {})
                  ).map(([mainCategory, types]) => (
                    <React.Fragment key={mainCategory}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                        {mainCategory}
                      </div>
                      {types.map(ct => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.sub_category}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verarbeite Rechnungen...</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-slate-500">{Math.round(progress)}% abgeschlossen</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleBulkCategorize}
              disabled={processing || (!useAI && !selectedCostTypeId)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Kategorisieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Zap, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { generateFinancialItemsForContract } from '@/components/contracts/generateFinancialItems';

export default function BulkBookingsGeneratorDialog({ open, onOpenChange, selectedContracts, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });

  const handleBulkGenerate = async () => {
    setProcessing(true);
    setProgress(0);
    setResults({ success: 0, failed: 0 });

    try {
      const total = selectedContracts.length;
      
      for (let i = 0; i < selectedContracts.length; i++) {
        const contract = selectedContracts[i];
        
        try {
          await generateFinancialItemsForContract(contract, []);
          setResults(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (error) {
          console.error(`Failed for contract ${contract.id}:`, error);
          setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        setProgress(((i + 1) / total) * 100);
      }

      toast.success(`${results.success + 1} Buchungen generiert`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error('Fehler beim Generieren');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buchungen für mehrere Verträge generieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>{selectedContracts.length}</strong> Verträge ausgewählt
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Für jeden Vertrag werden monatliche SOLL-Buchungen erstellt.
            </p>
          </div>

          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generiere Buchungen...</span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{Math.round(progress)}% abgeschlossen</span>
                <span>✓ {results.success} | ✗ {results.failed}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleBulkGenerate}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Generieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
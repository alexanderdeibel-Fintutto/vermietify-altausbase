import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WithdrawRequestDialog({ workflow, onWithdraw }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = async () => {
    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('withdrawApprovalRequest', {
        workflow_id: workflow.id,
        withdrawal_reason: reason || 'Kein Grund angegeben'
      });

      toast.success('Anfrage erfolgreich zurückgezogen');
      setIsOpen(false);
      setReason('');

      if (onWithdraw) {
        onWithdraw();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canWithdraw = ['pending'].includes(workflow.status);

  if (!canWithdraw) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" />
          Zurückziehen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anfrage zurückziehen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            ⚠️ Diese Aktion kann nicht rückgängig gemacht werden. Die Anfrage wird abgebrochen.
          </div>
          <div>
            <label className="text-sm font-semibold">Grund (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Warum ziehen Sie die Anfrage zurück?"
              className="mt-2"
              rows={3}
            />
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={isProcessing}
            variant="destructive"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird zurückgezogen...
              </>
            ) : (
              'Anfrage zurückziehen'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
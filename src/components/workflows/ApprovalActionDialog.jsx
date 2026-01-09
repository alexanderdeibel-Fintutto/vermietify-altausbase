import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalActionDialog({ workflow, onActionComplete }) {
  const [action, setAction] = useState(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    if (!action) return;

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('processApprovalAction', {
        workflow_id: workflow.id,
        action: action,
        comment: comment
      });

      toast.success(response.data?.message || `Anfrage ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`);
      setAction(null);
      setComment('');

      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setAction('approve')}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Genehmigen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anfrage genehmigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Kommentar (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kommentieren Sie die Genehmigung..."
                className="mt-2"
                rows={3}
              />
            </div>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird genehmigt...
                </>
              ) : (
                'Genehmigen'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setAction('reject')}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Ablehnen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anfrage ablehnen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Ablehnungsgrund *</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Begründen Sie die Ablehnung..."
                className="mt-2"
                rows={4}
              />
            </div>
            <Button
              onClick={handleAction}
              disabled={isProcessing || !comment.trim()}
              variant="destructive"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird abgelehnt...
                </>
              ) : (
                'Ablehnen'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AutoCorrectButton({ submissionId, onSuccess }) {
  const [correcting, setCorrecting] = useState(false);
  const [result, setResult] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const autoCorrect = async () => {
    setCorrecting(true);
    try {
      const response = await base44.functions.invoke('autoCorrectErrors', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setResult(response.data);
        setShowDialog(true);
        if (response.data.corrections_applied > 0) {
          toast.success(`${response.data.corrections_applied} Fehler automatisch korrigiert`);
          onSuccess?.();
        } else {
          toast.info('Keine Fehler zu korrigieren');
        }
      }
    } catch (error) {
      toast.error('Auto-Korrektur fehlgeschlagen');
      console.error(error);
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <>
      <Button
        onClick={autoCorrect}
        disabled={correcting}
        variant="outline"
        size="sm"
      >
        {correcting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4 mr-2" />
        )}
        Auto-Korrektur
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Automatische Korrekturen</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-3">
              <p className="text-sm">
                {result.corrections_applied} Korrekturen wurden angewendet
              </p>
              {result.corrections && result.corrections.length > 0 && (
                <div className="space-y-2">
                  {result.corrections.map((correction, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                      <div className="font-medium">{correction.field}</div>
                      <div className="text-slate-600">{correction.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
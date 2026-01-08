import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickDuplicateButton({ submission, onSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const response = await base44.functions.invoke('duplicateSubmissionForNewYear', {
        source_submission_id: submission.id,
        target_year: parseInt(targetYear)
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowDialog(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Duplizierung fehlgeschlagen');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
      >
        <Copy className="w-4 h-4 mr-2" />
        Für neues Jahr duplizieren
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formular duplizieren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Quell-Jahr</Label>
              <Input value={submission.tax_year} disabled />
            </div>

            <div>
              <Label>Ziel-Jahr</Label>
              <Input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                min={2020}
                max={2030}
              />
            </div>

            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              Das Formular wird mit allen Daten kopiert. Sie können die Werte anschließend anpassen.
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {duplicating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Duplizieren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
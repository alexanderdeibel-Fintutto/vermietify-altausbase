import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";

export default function BatchSubmitDialog({ submissionIds, open, onOpenChange, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setProgress(0);
    
    try {
      const response = await base44.functions.invoke('batchSubmitToElster', {
        submission_ids: submissionIds,
        submission_mode: 'TEST' // Oder von User wählen lassen
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success(`${response.data.summary.successful} von ${response.data.summary.total} erfolgreich übermittelt`);
        
        if (response.data.summary.successful > 0) {
          onSuccess?.();
        }
      }
    } catch (error) {
      toast.error('Massenübermittlung fehlgeschlagen');
      console.error(error);
    } finally {
      setSubmitting(false);
      setProgress(100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Massenübermittlung an ELSTER</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Es werden {submissionIds.length} Submissions validiert und an ELSTER übermittelt.
              Dies kann einige Minuten dauern.
            </AlertDescription>
          </Alert>

          {submitting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verarbeitung läuft...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.successful}
                  </div>
                  <div className="text-xs text-green-700">Erfolgreich</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.failed}
                  </div>
                  <div className="text-xs text-red-700">Fehlgeschlagen</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-600">
                    {results.summary.skipped}
                  </div>
                  <div className="text-xs text-slate-700">Übersprungen</div>
                </div>
              </div>

              {/* Erfolgreiche */}
              {results.results.success.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Erfolgreich übermittelt
                  </div>
                  {results.results.success.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                      {item.id}
                      {item.transfer_ticket && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.transfer_ticket}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {results.results.success.length > 5 && (
                    <div className="text-xs text-slate-600">
                      ... und {results.results.success.length - 5} weitere
                    </div>
                  )}
                </div>
              )}

              {/* Fehlgeschlagene */}
              {results.results.failed.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Fehlgeschlagen
                  </div>
                  {results.results.failed.map((item, idx) => (
                    <div key={idx} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium">{item.id}</div>
                      <div className="text-red-700 mt-1">{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              {results ? 'Schließen' : 'Abbrechen'}
            </Button>
            {!results && (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Jetzt übermitteln
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
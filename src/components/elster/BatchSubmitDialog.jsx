import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BatchSubmitDialog({ submissionIds, open, onOpenChange, onSuccess }) {
  const [certificateId, setCertificateId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const { data: certificates = [] } = useQuery({
    queryKey: ['elster-certificates'],
    queryFn: () => base44.entities.ElsterCertificate.list()
  });

  const activeCertificates = certificates.filter(c => c.is_active);

  const handleSubmit = async () => {
    if (!certificateId) {
      toast.error('Bitte Zertifikat auswählen');
      return;
    }

    setSubmitting(true);
    try {
      const response = await base44.functions.invoke('batchSubmitToElster', {
        submission_ids: submissionIds,
        certificate_id: certificateId
      });

      if (response.data.success) {
        setResults(response.data.results);
        toast.success(`${response.data.results.submitted} Submissions übermittelt`);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Batch-Submission fehlgeschlagen');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Batch-Übermittlung ({submissionIds.length} Submissions)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!results ? (
            <>
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Sie sind dabei, {submissionIds.length} Submissions an ELSTER zu übermitteln.
                  Stellen Sie sicher, dass alle Daten korrekt validiert wurden.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Zertifikat auswählen</Label>
                <Select value={certificateId} onValueChange={setCertificateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zertifikat wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCertificates.map(cert => (
                      <SelectItem key={cert.id} value={cert.id}>
                        {cert.certificate_name} ({cert.certificate_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !certificateId}
                  className="flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Jetzt übermitteln
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Abbrechen
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Erfolgreich</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {results.submitted}
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-700">Fehlgeschlagen</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {results.failed}
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {results.details.map((detail, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded border ${
                      detail.status === 'success' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{detail.id}</span>
                      <Badge variant={detail.status === 'success' ? 'default' : 'destructive'}>
                        {detail.status}
                      </Badge>
                    </div>
                    {detail.transfer_ticket && (
                      <div className="text-xs text-slate-600 mt-1">
                        Transfer-Ticket: {detail.transfer_ticket}
                      </div>
                    )}
                    {detail.error && (
                      <div className="text-xs text-red-600 mt-1">
                        Fehler: {detail.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Schließen
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
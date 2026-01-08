import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CertificateTestDialog({ certificate, open, onOpenChange, onTestComplete }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('testElsterConnection', {
        certificate_id: certificate.id
      });

      setResult(response.data);
      
      if (response.data.success) {
        toast.success('Verbindungstest erfolgreich!');
        onTestComplete?.(response.data);
      } else {
        toast.error('Verbindungstest fehlgeschlagen');
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message || 'Unbekannter Fehler' 
      });
      toast.error('Verbindungstest fehlgeschlagen');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ELSTER-Verbindungstest</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600">Zertifikat</div>
            <div className="font-medium">{certificate?.certificate_name}</div>
            <div className="text-sm text-slate-500 mt-1">
              {certificate?.certificate_type} | {certificate?.tax_number}
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Teste Verbindung...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Verbindung testen
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-900' : 'text-red-900'}>
                <div className="font-medium mb-2">
                  {result.success ? 'Test erfolgreich!' : 'Test fehlgeschlagen'}
                </div>
                {result.message && <p className="text-sm">{result.message}</p>}
                {result.error && <p className="text-sm mt-1">Fehler: {result.error}</p>}
                {result.elster_response && (
                  <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto max-h-32">
                    {JSON.stringify(result.elster_response, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
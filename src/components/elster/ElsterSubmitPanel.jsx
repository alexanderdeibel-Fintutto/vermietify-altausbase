import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ElsterSubmitPanel({ submission }) {
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  if (!submission || submission.status !== 'VALIDATED') {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Submission muss erst validiert werden, bevor sie eingereicht werden kann.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('submitElsterForm', {
        submissionId: submission.id
      });

      setSubmitResult(response.data);
      toast.success('Erfolgreich an ELSTER eingereicht!');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!submitResult ? (
        <Card>
          <CardHeader>
            <CardTitle>An ELSTER einreichen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900 mb-2">Bereit zur Einreichung</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ XML validiert</li>
                <li>✓ Steuerjahr: {submission.tax_year}</li>
                <li>✓ Formular: Anlage V</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ Wichtig:</p>
              <ul className="space-y-1">
                <li>• Überprüfen Sie alle Daten vor dem Einreichen</li>
                <li>• Eine Einreichung kann nicht rückgängig gemacht werden</li>
                <li>• Sie erhalten eine Referenznummer zur Verfolgung</li>
              </ul>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              An ELSTER einreichen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              Einreichung erfolgreich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-white rounded border border-green-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-700">✓ Eingereicht</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referenznummer:</span>
                  <span className="font-mono font-medium">{submitResult.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer ID:</span>
                  <span className="font-mono font-medium">{submitResult.transferId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zeitstempel:</span>
                  <span className="text-xs">{new Date().toLocaleString('de-DE')}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-100 text-green-800 text-sm rounded">
              <p>Die Einreichung wird vom ELSTER-System verarbeitet. Sie erhalten in Kürze eine Bestätigungsmitteilung.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
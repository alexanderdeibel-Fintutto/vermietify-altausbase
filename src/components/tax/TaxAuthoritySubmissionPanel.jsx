import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAuthoritySubmissionPanel({ taxForm, country, taxYear }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [canton, setCanton] = useState('ZH');
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleFINANZOnlineConnect = async () => {
    try {
      const clientId = Deno.env.get('FINANZONLINE_CLIENT_ID');
      window.location.href = `https://finanzonline.bmf.gv.at/oauth/authorize?client_id=${clientId}&redirect_uri=${window.location.origin}/finanzonline-callback&response_type=code`;
    } catch (err) {
      toast.error('Fehler beim Verbinden mit FINANZOnline');
    }
  };

  const handleSubmitAT = async () => {
    try {
      setSubmitting(true);
      const response = await base44.functions.invoke('submitToFINANZOnlineAT', {
        tax_form_id: taxForm.id,
        tax_year: taxYear,
        form_type: 'EINKST'
      });

      if (response.data.success) {
        setSubmitted(true);
        setSubmissionStatus(response.data.submission_id);
        toast.success('Erklärung eingereicht!');
      }
    } catch (err) {
      toast.error('Submission fehlgeschlagen: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCH = async () => {
    try {
      setSubmitting(true);
      const response = await base44.functions.invoke('submitToCantonalPortalCH', {
        tax_form_id: taxForm.id,
        tax_year: taxYear,
        canton,
        form_type: 'STEUERERKLARUNG'
      });

      if (response.data.success) {
        setSubmitted(true);
        setSubmissionStatus(response.data.submission_id);
        toast.success(`Erklärung für ${canton} eingereicht!`);
      }
    } catch (err) {
      toast.error('Submission fehlgeschlagen: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const response = await base44.functions.invoke('checkTaxSubmissionStatus', {
        submission_id: submissionStatus,
        country
      });

      setSubmissionStatus(response.data.status);
      toast.success(`Status: ${response.data.status}`);
    } catch (err) {
      toast.error('Statusabfrage fehlgeschlagen');
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileUp className="w-5 h-5 text-blue-600" />
          Elektronische Einreichung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {country === 'AT' ? (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Direkte Einreichung bei FINANZOnline Österreich möglich
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleFINANZOnlineConnect}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              FINANZOnline Verbinden
            </Button>

            {!submitted ? (
              <Button
                onClick={handleSubmitAT}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  'Bei FINANZOnline einreichen'
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Eingereicht</p>
                    <p className="text-sm">Referenz: {submissionStatus}</p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckStatus}
                  variant="outline"
                  className="w-full"
                >
                  Status aktualisieren
                </Button>
              </div>
            )}
          </>
        ) : country === 'CH' ? (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Direkte Einreichung bei Kantonalen Steuerbehörden
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium">Kanton</label>
              <Select value={canton} onValueChange={setCanton}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZH">Zürich</SelectItem>
                  <SelectItem value="BE">Bern</SelectItem>
                  <SelectItem value="AG">Aargau</SelectItem>
                  <SelectItem value="SG">St. Gallen</SelectItem>
                  <SelectItem value="BS">Basel-Stadt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!submitted ? (
              <Button
                onClick={handleSubmitCH}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  `Bei ${canton} einreichen`
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Eingereicht</p>
                    <p className="text-sm">Referenz: {submissionStatus}</p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckStatus}
                  variant="outline"
                  className="w-full"
                >
                  Status aktualisieren
                </Button>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
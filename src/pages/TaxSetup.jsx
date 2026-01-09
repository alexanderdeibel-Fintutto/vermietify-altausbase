import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CountrySelector from '@/components/tax/CountrySelector';
import CantonSelector from '@/components/tax/CantonSelector';
import { COUNTRIES, SWISS_CANTONS } from '@/utils/taxLocalization';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxSetup() {
  const [country, setCountry] = useState('');
  const [canton, setCanton] = useState('');

  const setupMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const data = {
        country,
        ...(country === 'CH' && { canton })
      };
      
      await base44.auth.updateMe(data);
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Steuerkonfiguration gespeichert!');
      // Redirect to tax dashboard after 1 second
      setTimeout(() => {
        window.location.href = '/TaxDashboard';
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const handleSave = () => {
    if (!country) {
      toast.error('Bitte wählen Sie ein Land aus');
      return;
    }
    if (country === 'CH' && !canton) {
      toast.error('Bitte wählen Sie einen Kanton aus');
      return;
    }
    setupMutation.mutate();
  };

  const selectedCountry = COUNTRIES[country];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🌍 Steuersystem Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Erste Konfiguration</AlertTitle>
            <AlertDescription>
              Wählen Sie das Land aus, in dem Sie Ihre Steuererklärung einreichen möchten. Dies bestimmt, welche Steuerformulare Ihnen zur Verfügung stehen.
            </AlertDescription>
          </Alert>

          <CountrySelector 
            value={country} 
            onChange={setCountry}
            label="Welches Land?"
          />

          {country === 'CH' && (
            <div className="space-y-2 p-4 bg-slate-50 rounded border">
              <p className="text-sm text-slate-600 mb-3">
                Da Sie die Schweiz gewählt haben, benötigen wir auch Ihren Wohnkanton für die richtige Steuerberechnung:
              </p>
              <CantonSelector 
                value={canton}
                onChange={setCanton}
              />
            </div>
          )}

          {country && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Konfiguration</AlertTitle>
              <AlertDescription>
                Land: <strong>{selectedCountry?.name}</strong>
                {country === 'CH' && canton && (
                  <> • Kanton: <strong>{SWISS_CANTONS[canton]?.name}</strong></>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline">Abbrechen</Button>
            <Button
              onClick={handleSave}
              disabled={!country || (country === 'CH' && !canton) || setupMutation.isPending}
              className="gap-2"
            >
              {setupMutation.isPending ? 'Wird gespeichert...' : 'Speichern & Weiter'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
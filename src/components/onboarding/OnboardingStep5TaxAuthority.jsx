import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingStep5TaxAuthority({ formData, setFormData }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnectFINANZOnline = async () => {
    try {
      setConnecting(true);
      const clientId = process.env.REACT_APP_FINANZONLINE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/finanzonline-callback`;
      window.location.href = `https://finanzonline.bmf.gv.at/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    } catch (err) {
      toast.error('Verbindung fehlgeschlagen');
      setConnecting(false);
    }
  };

  const authorities = formData.tax_jurisdictions.map(country => {
    if (country === 'AT') {
      return {
        country,
        name: 'FINANZOnline Österreich',
        description: 'Direktes Einreichen von Steuererklärungen',
        button: 'Mit FINANZOnline verbinden',
        action: handleConnectFINANZOnline
      };
    } else if (country === 'CH') {
      return {
        country,
        name: 'Kantonale e-tax Portale',
        description: 'Verbindung zu Ihrem Kantonalen Portal',
        button: 'Später konfigurieren',
        action: null
      };
    } else if (country === 'DE') {
      return {
        country,
        name: 'ELSTER (Bundeszentralamt)',
        description: 'Elektronische Steuererklärung',
        button: 'Später konfigurieren',
        action: null
      };
    }
  }).filter(Boolean);

  return (
    <div className="space-y-4">
      <p className="text-slate-600 mb-6">
        Verbinden Sie Ihre Konten mit Steuerbehörden, um direkt einreichen zu können. Dies ist optional - Sie können es später auch tun.
      </p>

      <Alert className="bg-blue-50 border-blue-200 mb-6">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Die Verbindung zu Steuerbehörden ermöglicht direktes Einreichen ohne manuelle Schritte.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {authorities.map(authority => (
          <Card key={authority.country} className="p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{authority.name}</h3>
                <p className="text-sm text-slate-600">{authority.description}</p>
              </div>
              <Badge variant="outline" className="ml-2">{authority.country}</Badge>
            </div>
            <Button
              onClick={authority.action}
              disabled={connecting || !authority.action}
              variant={authority.action ? 'default' : 'outline'}
              size="sm"
              className="mt-3 w-full"
            >
              {authority.button}
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-4 bg-green-50 border border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Können Sie später hinzufügen</p>
            <p className="text-sm text-green-800">Sie können Behördenverbindungen jederzeit in den Einstellungen konfigurieren.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
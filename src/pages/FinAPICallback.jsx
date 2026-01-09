import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FinAPICallback() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verbindung wird hergestellt...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          setStatus('error');
          setMessage('Authentifizierung abgebrochen');
          setTimeout(() => navigate(createPageUrl('UserSettings')), 3000);
          return;
        }

        // Call backend to exchange code for tokens
        const response = await base44.functions.invoke('connectFINANZOnlineAT', {
          action: 'oauth_callback',
          code,
          state
        });

        if (response.data.success) {
          setStatus('success');
          setMessage('FINANZOnline erfolgreich verbunden!');
          setTimeout(() => navigate(createPageUrl('TaxAuthoritySubmissions')), 2000);
        } else {
          setStatus('error');
          setMessage('Verbindung fehlgeschlagen');
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Fehler: ${error.message}`);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentifizierung</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <p className="text-slate-600">{message}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
              <p className="text-slate-600">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
              <p className="text-slate-600">{message}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
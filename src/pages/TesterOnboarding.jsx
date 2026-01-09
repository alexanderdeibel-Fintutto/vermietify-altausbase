import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TesterOnboardingPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [validInvite, setValidInvite] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('verify'); // verify, register, complete
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    
    if (inviteToken) {
      setToken(inviteToken);
      verifyInvitation(inviteToken);
    } else {
      setError('Kein Einladungstoken gefunden');
      setLoading(false);
    }
  }, []);

  const verifyInvitation = async (inviteToken) => {
    try {
      const invitations = await base44.entities.TesterInvitation.filter({ 
        invitation_token: inviteToken 
      });

      if (invitations.length === 0) {
        setError('Ungültiger Einladungslink');
        setLoading(false);
        return;
      }

      const invitation = invitations[0];

      if (invitation.status !== 'pending') {
        setError('Diese Einladung wurde bereits verwendet');
        setLoading(false);
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setError('Diese Einladung ist abgelaufen');
        setLoading(false);
        return;
      }

      setEmail(invitation.invited_email);
      setValidInvite(true);
      setLoading(false);
    } catch (err) {
      setError('Fehler beim Überprüfen der Einladung');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      
      await base44.functions.invoke('createTesterAccount', {
        invitationToken: token,
        testerEmail: email
      });

      setStep('complete');
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen des Accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Einladung wird überprüft...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Willkommen im Beta-Test!</h2>
            <p className="text-slate-600 mb-6">
              Dein Tester-Account wurde erfolgreich erstellt. Du erhältst gleich eine Email mit deinen Zugangsdaten.
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/'}
            >
              Zum Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Beta-Tester Einladung</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-slate-600 mb-4">
              Du wurdest eingeladen, unsere Immobilienverwaltungs-App zu testen!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Account-Typ:</strong> Beta-Tester (Admin-Rechte, volle Module)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Als Beta-Tester erhältst du:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Kostenloser Admin-Zugang
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Alle Module freigeschaltet
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Unbegrenzte Objekte & Mieter
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Bug-Report Tool integriert
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Direkter Kontakt zum Entwickler-Team
              </li>
            </ul>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? 'Account wird erstellt...' : 'Einladung annehmen'}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Mit dem Akzeptieren stimmst du zu, aktiv am Beta-Test teilzunehmen und Feedback zu geben.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
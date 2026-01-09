import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function TesterAcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Kein gültiger Einladungs-Link');
        setLoading(false);
        return;
      }

      try {
        const response = await base44.functions.invoke('validateTesterInvitation', { token });
        
        if (response.data.valid) {
          setInvitation(response.data.invitation);
        } else {
          setError(response.data.error || 'Einladungs-Link ungültig oder abgelaufen');
        }
      } catch (err) {
        setError('Fehler beim Validieren der Einladung: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const user = await base44.auth.me();
      
      if (!user) {
        base44.auth.redirectToLogin(`/tester-accept-invitation?token=${token}`);
        return;
      }

      const response = await base44.functions.invoke('validateTesterInvitation', {
        token,
        action: 'accept',
        user_id: user.id
      });

      if (response.data.success) {
        toast.success('Einladung angenommen! Herzlich willkommen! 🎉');
        setTimeout(() => navigate('/tester-dashboard'), 2000);
      } else {
        toast.error(response.data.error || 'Fehler beim Annehmen der Einladung');
      }
    } catch (err) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          </div>
          <p className="text-center font-light text-slate-600">Einladung wird validiert...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-lg font-light text-slate-800 text-center mb-2">Fehler</h2>
          <p className="text-center font-light text-slate-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full bg-slate-700 hover:bg-slate-800">
            Zur Startseite
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-light text-slate-800 text-center mb-2">Einladung erhalten!</h1>
        
        {invitation && (
          <>
            <p className="text-center font-light text-slate-600 mb-6">
              Hallo <strong>{invitation.tester_name}</strong>,<br />
              <br />
              du wurdest eingeladen, die App zu testen und Feedback zu geben.
            </p>

            {invitation.custom_message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-light text-blue-900 italic">"{invitation.custom_message}"</p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird angenommen...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Einladung annehmen
                  </>
                )}
              </Button>

              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Später
              </Button>
            </div>
          </>
        )}

        <p className="text-xs font-light text-slate-400 text-center mt-6">
          Diese Einladung gültig bis: {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString('de-DE') : '—'}
        </p>
      </Card>
    </div>
  );
}
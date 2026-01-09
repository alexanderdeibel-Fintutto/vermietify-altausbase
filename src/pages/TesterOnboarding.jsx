import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function TesterOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // States
  const [step, setStep] = useState(1); // 1: validate, 2: welcome, 3: setup, 4: activating
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTracking, setAgreeTracking] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationSteps, setActivationSteps] = useState([]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError({
          title: 'Ungültiger Link 🤔',
          message: 'Bitte prüfe, ob der Link vollständig kopiert wurde.',
          action: 'Startseite'
        });
        setStep(1);
        setLoading(false);
        return;
      }

      try {
        const response = await base44.functions.invoke('validateTesterToken', { token });
        
        if (response.data.valid) {
          setInvitation(response.data.invitation);
          setName(response.data.invitation.tester_name || '');
          setStep(2); // Go to welcome
        } else {
          const errorMap = {
            expired: {
              title: 'Einladung abgelaufen ⏰',
              message: 'Der Link ist 2 Wochen gültig. Kontaktiere Alexander für einen neuen Link.'
            },
            already_accepted: {
              title: 'Schon dabei! 🎉',
              message: 'Dein Test-Account ist bereits aktiviert.',
              action: 'Zum Dashboard'
            },
            revoked: {
              title: 'Einladung zurückgezogen',
              message: 'Diese Einladung wurde widerrufen. Kontaktiere Alexander.'
            },
            invalid: {
              title: 'Ungültiger Link',
              message: 'Der Einladungslink ist nicht mehr gültig.'
            }
          };

          setError(errorMap[response.data.status] || errorMap.invalid);
          setStep(1);
        }
      } catch (err) {
        setError({
          title: 'Technisches Problem 🔧',
          message: 'Etwas ist schiefgelaufen. Alexander behebt das gerne.',
          action: 'Problem melden'
        });
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Handle account activation
  const handleActivate = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Bitte gib deinen Namen ein');
      return;
    }
    if (password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    if (!agreeTracking) {
      toast.error('Bitte akzeptiere die Datenschutzerklärung');
      return;
    }

    setActivating(true);
    setStep(4);
    setActivationSteps([]);

    try {
      // Step 1: Create account
      setActivationSteps(prev => [...prev, { text: 'Test-Account wird erstellt...', done: false }]);

      const response = await base44.functions.invoke('activateTesterAccount', {
        token,
        name: name.trim(),
        password,
        agreed_to_tracking: true
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Account-Erstellung fehlgeschlagen');
      }

      // Update step tracker
      setActivationSteps(prev => {
        const updated = [...prev];
        updated[0].done = true;
        return [...updated, { text: 'Administrator-Rechte aktiviert...', done: false }];
      });

      // Step 2: Load test environment
      setActivationSteps(prev => {
        const updated = [...prev];
        updated[1].done = true;
        return [...updated, { text: 'Module freigeschaltet...', done: false }];
      });

      // Step 3: Final
      setActivationSteps(prev => {
        const updated = [...prev];
        updated[2].done = true;
        return [...updated, { text: 'Weiterleitung wird vorbereitet...', done: false }];
      });

      // Wait a moment for visual feedback
      await new Promise(r => setTimeout(r, 1500));

      setActivationSteps(prev => {
        const updated = [...prev];
        updated[3].done = true;
        return updated;
      });

      // Redirect to dashboard
      toast.success('Account aktiviert! 🎉');
      setTimeout(() => {
        navigate('/tester-dashboard');
      }, 1000);
    } catch (err) {
      setActivating(false);
      setStep(2);
      toast.error('Fehler: ' + err.message);
    }
  };

  // Error screen
  if (error && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-xl font-light text-slate-800 text-center mb-2">{error.title}</h1>
          <p className="text-center font-light text-slate-600 mb-6">{error.message}</p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-700 hover:bg-slate-800"
          >
            {error.action || 'Startseite'}
          </Button>
        </Card>
      </div>
    );
  }

  // Loading
  if (loading || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="font-light text-slate-600">Einladung wird überprüft...</p>
        </Card>
      </div>
    );
  }

  // Welcome step
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light text-slate-800">Willkommen! 👋</h1>
            <p className="text-sm font-light text-slate-600 mt-2">
              Hallo <strong>{invitation.tester_name}</strong>, schön dass du dabei bist!
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">🎯 Das wirst du testen:</p>
              <ul className="text-xs font-light text-blue-800 space-y-1">
                <li>✓ Komplett funktionsfähige Immobilienverwaltung</li>
                <li>✓ Alle Features sind freigeschaltet</li>
                <li>✓ Beispiel-Daten sind bereits angelegt</li>
                <li>✓ Du bist als Administrator angemeldet</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 mb-2">⚡ So funktioniert's:</p>
              <ul className="text-xs font-light text-amber-800 space-y-1">
                <li>✓ Einfach die App normal verwenden</li>
                <li>✓ Probleme? → Klick auf "🐛 Problem melden"</li>
                <li>✓ Deine Aktivitäten werden aufgezeichnet</li>
                <li>✓ Test dauert ca. 30-45 Minuten</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setStep(3)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            Account erstellen
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    );
  }

  // Setup step
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-xl font-light text-slate-800 mb-6">Dein Account</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-slate-700">E-Mail</label>
              <Input 
                type="email"
                value={invitation.invited_email}
                disabled
                className="mt-1 bg-slate-100 text-slate-600"
              />
              <p className="text-xs font-light text-slate-500 mt-1">Diese E-Mail kannst du nicht ändern</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Name</label>
              <Input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Passwort (mind. 8 Zeichen)</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Passwort bestätigen</label>
              <Input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox"
                id="tracking"
                checked={agreeTracking}
                onChange={(e) => setAgreeTracking(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="tracking" className="text-xs font-light text-slate-600">
                Ich verstehe, dass meine Test-Aktivitäten anonymisiert aufgezeichnet werden, um die App zu verbessern.
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => setStep(2)}
              variant="outline"
              className="flex-1"
            >
              Zurück
            </Button>
            <Button 
              onClick={handleActivate}
              disabled={activating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird aktiviert...
                </>
              ) : (
                <>
                  Test starten
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Activating step
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <h2 className="text-lg font-light text-slate-800">Account wird eingerichtet...</h2>
          </div>

          <div className="space-y-2">
            {activationSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin flex-shrink-0" />
                )}
                <span className={`text-sm font-light ${step.done ? 'text-slate-600' : 'text-slate-500'}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-light text-slate-400 text-center mt-6">
            Dauert nur einen Moment...
          </p>
        </Card>
      </div>
    );
  }
}
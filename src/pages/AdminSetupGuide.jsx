import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminSetupGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);

  const steps = [
    {
      id: 1,
      title: '📊 System verstehen',
      description: 'Übersicht über die 3 Haupt-Komponenten',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-light text-blue-900 mb-2">🧪 Test Analytics</h4>
            <p className="text-sm font-light text-blue-800">Verfolgt Tester-Aktivitäten, Sessions, Assignments & Probleme in Echtzeit</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-light text-purple-900 mb-2">🧹 Test Cleanup</h4>
            <p className="text-sm font-light text-purple-800">Beendet Test-Phasen mit DSGVO-Anonymisierung & Daten-Archivierung</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-light text-orange-900 mb-2">🤖 AI-Insights</h4>
            <p className="text-sm font-light text-orange-800">Erkennt UX-Muster, analysiert Sentiment & empfiehlt A/B-Tests</p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '🎛️ Master Dashboard einrichten',
      description: 'Zentrale Überwachung aller Systeme',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">Das Master Dashboard zeigt:</p>
          <ul className="text-sm font-light text-slate-700 space-y-2 ml-4">
            <li>✓ System Health Status</li>
            <li>✓ Kritische Alerts & Insights</li>
            <li>✓ Active Test Phases</li>
            <li>✓ Geplante Aufgaben</li>
          </ul>
          <Link to={createPageUrl('AdminMasterDashboard')}>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light mt-4">
              Zum Master Dashboard
            </Button>
          </Link>
        </div>
      )
    },
    {
      id: 3,
      title: '📈 Analytics konfigurieren',
      description: 'Tester-Daten erfassen & analysieren',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">Im Analytics Dashboard kannst du:</p>
          <ul className="text-sm font-light text-slate-700 space-y-2 ml-4">
            <li>✓ Tester-Aktivitäten verfolgen</li>
            <li>✓ Top Problem Pages sehen</li>
            <li>✓ User Journeys analysieren</li>
            <li>✓ Reports exportieren</li>
          </ul>
          <Link to={createPageUrl('AdminTesterAnalytics')}>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light mt-4">
              Zu den Analytics
            </Button>
          </Link>
        </div>
      )
    },
    {
      id: 4,
      title: '🤖 AI-Insights aktivieren',
      description: 'Automatische Pattern-Erkennung & Recommendations',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">AI-Features:</p>
          <ul className="text-sm font-light text-slate-700 space-y-2 ml-4">
            <li>✓ UX-Pattern Detection</li>
            <li>✓ Sentiment Analysis</li>
            <li>✓ Conversion Predictions</li>
            <li>✓ A/B Test Recommendations</li>
          </ul>
          <Link to={createPageUrl('AdminAIAnalytics')}>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light mt-4">
              Zu AI-Insights
            </Button>
          </Link>
        </div>
      )
    },
    {
      id: 5,
      title: '🧹 Test-Phasen beenden',
      description: 'Sicheres Archivieren & Anonymisieren',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">Cleanup-Prozess:</p>
          <ol className="text-sm font-light text-slate-700 space-y-2 ml-4 list-decimal">
            <li>Test-Phase auswählen</li>
            <li>Cleanup-Typ definieren (Manual/Auto/Scheduled)</li>
            <li>Daten-Kategorien wählen</li>
            <li>Anonymisierung & Archivierung durchführen</li>
            <li>Backup erstellen für Rollback</li>
          </ol>
          <Link to={createPageUrl('AdminTestCleanup')}>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light mt-4">
              Zur Cleanup-Seite
            </Button>
          </Link>
        </div>
      )
    },
    {
      id: 6,
      title: '⚙️ Automatisierung einrichten',
      description: 'Scheduled Tasks & Notifications',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">Standard-Schedule (UTC):</p>
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm font-light">
            <p>🕐 02:00 - Daily Analytics</p>
            <p>🕐 04:00 - AI Insights</p>
            <p>🕐 08:00 - Weekly Report (Mo)</p>
            <p>🕐 Hourly - Alert Checks</p>
          </div>
          <p className="text-xs font-light text-slate-500 mt-3">Alle Tasks sind im Master Dashboard einsehbar</p>
        </div>
      )
    },
    {
      id: 7,
      title: '🧪 Sample-Daten laden',
      description: 'Realistische Test-Daten zum Ausprobieren',
      content: (
        <div className="space-y-4">
          <p className="text-sm font-light text-slate-700">Dies wird erstellen:</p>
          <ul className="text-sm font-light text-slate-700 space-y-2 ml-4">
            <li>✓ 5 Test Accounts</li>
            <li>✓ 50 Test Assignments</li>
            <li>✓ 200+ Aktivitäten pro Account</li>
            <li>✓ 30 Probleme-Reports</li>
            <li>✓ UX-Patterns & AI-Insights</li>
          </ul>
          <Button
            onClick={async () => {
              setIsSeeding(true);
              try {
                const res = await base44.functions.invoke('seedCompleteDemoData', {});
                toast.success('Demo-Daten geladen! ✅');
                setCompletedSteps([...completedSteps, 7]);
              } catch (err) {
                toast.error('Fehler beim Laden: ' + err.message);
              } finally {
                setIsSeeding(false);
              }
            }}
            disabled={isSeeding}
            className="w-full bg-slate-700 hover:bg-slate-800 font-light mt-4"
          >
            {isSeeding ? 'Lädt...' : '📥 Demo-Daten laden'}
          </Button>
        </div>
      )
    }
  ];

  const handleStepComplete = () => {
    if (!completedSteps.includes(steps[currentStep].id)) {
      setCompletedSteps([...completedSteps, steps[currentStep].id]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 mb-2">🚀 Admin Setup Guide</h1>
          <p className="text-sm font-light text-slate-600">Schritt-für-Schritt Setup für dein Test & Analytics System</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-light text-slate-700">Fortschritt: {completedSteps.length}/{steps.length}</span>
            <span className="text-sm font-light text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full">
            <div
              className="h-2 bg-green-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  currentStep === idx
                    ? 'bg-slate-700 text-white'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-xs font-light">{step.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card className="p-8 border border-slate-200">
              <Badge className="mb-4 bg-blue-100 text-blue-800 font-light">
                Schritt {currentStep + 1} von {steps.length}
              </Badge>
              <h2 className="text-2xl font-light text-slate-900 mb-2">{steps[currentStep].title}</h2>
              <p className="text-sm font-light text-slate-600 mb-6">{steps[currentStep].description}</p>

              {steps[currentStep].content}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="font-light"
                >
                  ← Zurück
                </Button>
                <Button
                  onClick={handleStepComplete}
                  className="flex-1 bg-slate-700 hover:bg-slate-800 font-light gap-2"
                >
                  {completedSteps.includes(steps[currentStep].id) ? '✓ Abgeschlossen' : 'Verstanden'}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
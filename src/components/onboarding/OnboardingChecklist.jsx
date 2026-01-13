import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const ONBOARDING_STEPS = [
  { id: 'building', label: 'Erstes Gebäude anlegen', page: 'Buildings', description: 'Starte mit der Erfassung deines ersten Objekts' },
  { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', page: 'Units', description: 'Teile das Gebäude in vermietbare Wohneinheiten auf' },
  { id: 'purchase', label: 'Kaufvertrag mit Grundstücksanteil erfassen', page: 'Buildings', description: 'Wichtig: Grundstücksanteil korrekt trennen für AfA-Berechnung' },
  { id: 'owner', label: 'Eigentümer mit Anteilen zuordnen', page: 'Buildings', description: 'Definiere Eigentumsverhältnisse' },
  { id: 'lease', label: 'Ersten Mietvertrag erstellen', page: 'Contracts', description: 'Verbinde Einheiten mit Mietern' },
  { id: 'bookings', label: '"Buchungen generieren" klicken', page: 'Contracts', description: 'Erstelle automatische SOLL-Buchungen für Mieteinnahmen' },
  { id: 'bank', label: 'Bankverbindung einrichten', page: 'BankAccounts', description: 'Verbinde dein Bankkonto für IST-Zahlungen' },
  { id: 'invoice', label: 'Erste Rechnung kategorisieren', page: 'Invoices', description: 'Erfasse Ausgaben und kategorisiere sie richtig' }
];

export default function OnboardingChecklist() {
  const [collapsed, setCollapsed] = useState(true);
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('onboarding_completed');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('onboarding_completed', JSON.stringify(completed));
  }, [completed]);

  const toggleStep = (stepId) => {
    setCompleted(prev => 
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  const progressPercent = (completed.length / ONBOARDING_STEPS.length) * 100;
  const isComplete = completed.length === ONBOARDING_STEPS.length;

  if (isComplete) return null;

  return (
    <Card className="sticky top-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
          <CardTitle className="text-base">🚀 Onboarding ({completed.length}/{ONBOARDING_STEPS.length})</CardTitle>
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      
      {!collapsed && (
        <CardContent className="space-y-2">
          {ONBOARDING_STEPS.map(step => (
            <div key={step.id} className="p-3 bg-white rounded-lg hover:bg-slate-50 transition">
              <div className="flex items-start gap-2">
                <button 
                  onClick={() => toggleStep(step.id)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {completed.includes(step.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${completed.includes(step.id) ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                </div>
                {!completed.includes(step.id) && (
                  <Link to={createPageUrl(step.page)}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Jetzt
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
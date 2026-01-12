import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ONBOARDING_ITEMS = [
  { id: 1, label: 'Erstes Gebäude anlegen', page: 'Buildings', icon: '🏠' },
  { id: 2, label: 'Einheiten zum Gebäude hinzufügen', page: 'Units', icon: '🚪' },
  { id: 3, label: 'Kaufvertrag mit Grundstücksanteil erfassen', page: 'AssetManagement', icon: '📄' },
  { id: 4, label: 'Eigentümer mit Anteilen zuordnen', page: 'AssetManagement', icon: '👤' },
  { id: 5, label: 'Ersten Mietvertrag erstellen', page: 'LeaseContracts', icon: '✍️' },
  { id: 6, label: '"Buchungen generieren" klicken', page: 'GeneratedBookings', icon: '💰' },
  { id: 7, label: 'Bankverbindung einrichten', page: 'BankAccounts', icon: '🏦' },
  { id: 8, label: 'Erste Rechnung kategorisieren', page: 'Invoices', icon: '📊' },
];

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState(() => {
    const stored = localStorage.getItem('onboarding_completed');
    return stored ? JSON.parse(stored) : [];
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('onboarding_completed', JSON.stringify(completed));
  }, [completed]);

  const toggleItem = (id) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completed.length / ONBOARDING_ITEMS.length) * 100);
  const allComplete = completed.length === ONBOARDING_ITEMS.length;

  if (allComplete && collapsed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(false)} className="w-full">
            <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
            ✅ Onboarding abgeschlossen!
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">🚀 Onboarding</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-slate-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all ${
                allComplete ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-slate-700">{progress}%</span>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-2">
          {ONBOARDING_ITEMS.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded hover:bg-slate-50 transition-colors ${
                completed.includes(item.id) ? 'opacity-60' : ''
              }`}
            >
              <Checkbox
                id={`onboarding-${item.id}`}
                checked={completed.includes(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <label
                htmlFor={`onboarding-${item.id}`}
                className={`text-sm flex-1 cursor-pointer ${
                  completed.includes(item.id) ? 'line-through text-slate-500' : 'text-slate-700'
                }`}
              >
                {item.icon} {item.label}
              </label>
              {!completed.includes(item.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl(item.page)}
                  className="text-xs h-6 px-2"
                >
                  Los
                </Button>
              )}
            </div>
          ))}

          {allComplete && (
            <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
              <p className="text-sm font-semibold text-green-800">✅ Herzlichen Glückwunsch!</p>
              <p className="text-xs text-green-700 mt-1">Du hast alle Onboarding-Schritte erledigt.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
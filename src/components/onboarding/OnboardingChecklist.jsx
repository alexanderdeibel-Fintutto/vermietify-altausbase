import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function OnboardingChecklist() {
  const [progress, setProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const saved = localStorage.getItem(`onboarding_${u?.id}`);
        if (saved) {
          setProgress(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const checklist = [
    { id: 'building', label: 'Erstes Gebäude anlegen', page: 'Buildings' },
    { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', page: 'UnitsManagement' },
    { id: 'contract', label: 'Kaufvertrag mit Grundstücksanteil', page: 'Buildings' },
    { id: 'owner', label: 'Eigentümer mit Anteilen zuordnen', page: 'Buildings' },
    { id: 'lease', label: 'Ersten Mietvertrag erstellen', page: 'Contracts' },
    { id: 'bookings', label: 'Buchungen generieren', page: 'GeneratedBookings' },
    { id: 'bank', label: 'Bankverbindung einrichten', page: 'BankAccounts' },
    { id: 'invoice', label: 'Erste Rechnung kategorisieren', page: 'Invoices' }
  ];

  const completed = Object.values(progress).filter(Boolean).length;
  const completionPercent = (completed / checklist.length) * 100;

  const toggleItem = (id) => {
    const newProgress = { ...progress, [id]: !progress[id] };
    setProgress(newProgress);
    if (user?.id) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newProgress));
    }
  };

  if (completionPercent === 100) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">🚀 Onboarding-Fortschritt</CardTitle>
            <p className="text-sm text-slate-600 mt-1">{completed}/{checklist.length} Schritte</p>
          </div>
          <div className="text-2xl font-light text-slate-700">{Math.round(completionPercent)}%</div>
        </div>
        <Progress value={completionPercent} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-2">
        {checklist.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors text-left"
          >
            {progress[item.id] ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
            )}
            <span className={progress[item.id] ? 'line-through text-slate-500 text-sm' : 'text-sm text-slate-700'}>
              {item.label}
            </span>
          </button>
        ))}
        {completed < checklist.length && (
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full mt-3"
          >
            <a href={createPageUrl(checklist.find(c => !progress[c.id])?.page || 'Dashboard')}>
              Nächster Schritt
              <ChevronRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
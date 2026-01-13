import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function OnboardingChecklist() {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load from localStorage
        const saved = localStorage.getItem(`onboarding_${currentUser.id}`);
        if (saved) {
          setProgress(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };
    loadUserProgress();
  }, []);

  const items = [
    { id: 'building', label: 'Erstes Gebäude anlegen', link: createPageUrl('Buildings') },
    { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', link: createPageUrl('Buildings') },
    { id: 'purchase', label: 'Kaufvertrag mit Grundstücksanteil erfassen', link: createPageUrl('Documents') },
    { id: 'owners', label: 'Eigentümer mit Anteilen zuordnen', link: createPageUrl('Buildings') },
    { id: 'lease', label: 'Ersten Mietvertrag erstellen', link: createPageUrl('LeaseContracts') },
    { id: 'generate', label: '"Buchungen generieren" klicken', link: createPageUrl('LeaseContracts') },
    { id: 'banking', label: 'Bankverbindung einrichten', link: createPageUrl('BankAccounts') },
    { id: 'invoice', label: 'Erste Rechnung kategorisieren', link: createPageUrl('Invoices') },
  ];

  const toggleItem = (id) => {
    const updated = { ...progress, [id]: !progress[id] };
    setProgress(updated);
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(updated));
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  if (progressPercent === 100) {
    return null; // Hide when complete
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardHeader 
        className="cursor-pointer pb-3" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              🚀 Onboarding-Checkliste
            </CardTitle>
            <CardDescription>
              {completedCount} von {items.length} erledigt ({progressPercent}%)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-emerald-700">{progressPercent}%</span>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-100 transition-colors group"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 transition-colors"
              >
                {progress[item.id] ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 group-hover:text-emerald-300" />
                )}
              </button>
              <span
                className={`flex-1 ${
                  progress[item.id]
                    ? 'line-through text-slate-500'
                    : 'text-slate-700'
                }`}
              >
                {item.label}
              </span>
              {!progress[item.id] && (
                <Link to={item.link}>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Erledigen
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
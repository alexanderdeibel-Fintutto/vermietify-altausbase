import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const ONBOARDING_ITEMS = [
  { id: 'building', label: 'Erstes Gebäude anlegen', page: 'Buildings' },
  { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', page: 'UnitsManagement' },
  { id: 'purchase', label: 'Kaufvertrag mit Grundstücksanteil erfassen', page: 'Buildings' },
  { id: 'owner', label: 'Eigentümer mit Anteilen zuordnen', page: 'Buildings' },
  { id: 'lease', label: 'Ersten Mietvertrag erstellen', page: 'LeaseContracts' },
  { id: 'bookings', label: 'Buchungen generieren klicken', page: 'GeneratedBookings' },
  { id: 'bank', label: 'Bankverbindung einrichten', page: 'BankAccounts' },
  { id: 'invoice', label: 'Erste Rechnung kategorisieren', page: 'Invoices' }
];

export default function OnboardingChecklist() {
  const [collapsed, setCollapsed] = useState(true);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('onboarding_progress');
    if (saved) {
      setCompleted(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (id) => {
    const updated = { ...completed, [id]: !completed[id] };
    setCompleted(updated);
    localStorage.setItem('onboarding_progress', JSON.stringify(updated));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((completedCount / ONBOARDING_ITEMS.length) * 100);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">🚀 Getting Started</CardTitle>
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
        <div className="mt-2 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-600 mt-1">{completedCount}/{ONBOARDING_ITEMS.length} Schritte</p>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-2">
          {ONBOARDING_ITEMS.map(item => (
            <Link key={item.id} to={createPageUrl(item.page)}>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 cursor-pointer transition">
                <Checkbox
                  checked={completed[item.id] || false}
                  onCheckedChange={() => handleToggle(item.id)}
                  onClick={(e) => e.preventDefault()}
                />
                <span className={`text-xs flex-1 ${completed[item.id] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                {completed[item.id] && <span className="text-green-600">✓</span>}
              </label>
            </Link>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
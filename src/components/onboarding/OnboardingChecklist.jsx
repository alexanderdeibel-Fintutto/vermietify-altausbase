import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CHECKLIST_ITEMS = [
  { id: 'building', label: 'Erstes Gebäude anlegen', link: createPageUrl('Buildings') },
  { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', link: createPageUrl('Buildings') },
  { id: 'purchase', label: 'Kaufvertrag mit Grundstücksanteil', link: createPageUrl('Buildings') },
  { id: 'owners', label: 'Eigentümer mit Anteilen zuordnen', link: createPageUrl('Buildings') },
  { id: 'lease', label: 'Ersten Mietvertrag erstellen', link: createPageUrl('Tenants') },
  { id: 'bookings', label: 'Buchungen generieren', link: createPageUrl('GeneratedBookings') },
  { id: 'bank', label: 'Bankverbindung einrichten', link: createPageUrl('BankAccounts') },
  { id: 'invoice', label: 'Erste Rechnung kategorisieren', link: createPageUrl('Invoices') },
];

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_checklist');
    if (saved) {
      setCompleted(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const toggleItem = (id) => {
    const newCompleted = completed.includes(id)
      ? completed.filter(c => c !== id)
      : [...completed, id];
    setCompleted(newCompleted);
    localStorage.setItem('onboarding_checklist', JSON.stringify(newCompleted));
  };

  const progress = Math.round((completed.length / CHECKLIST_ITEMS.length) * 100);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">🎯 Onboarding</CardTitle>
            <Badge variant="outline" className="text-xs">
              {completed.length}/{CHECKLIST_ITEMS.length} ({progress}%)
            </Badge>
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
        <div className="h-1.5 bg-blue-200 rounded-full mt-2">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <Link key={item.id} to={item.link}>
              <div className="flex items-center gap-2 p-2 rounded hover:bg-blue-100 transition cursor-pointer">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleItem(item.id);
                  }}
                  className="focus:outline-none"
                >
                  {completed.includes(item.id) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <span
                  className={`text-xs flex-1 ${
                    completed.includes(item.id) ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-slate-300 text-xs">→</span>
              </div>
            </Link>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
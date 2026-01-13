import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CHECKLIST_ITEMS = [
  { id: 'building', label: 'Erstes Gebäude anlegen', page: 'Buildings', icon: '🏢' },
  { id: 'units', label: 'Einheiten zum Gebäude hinzufügen', page: 'UnitsManagement', icon: '🏠' },
  { id: 'purchase', label: 'Kaufvertrag mit Grundstücksanteil erfassen', page: 'BuildingDetail', icon: '📋' },
  { id: 'owners', label: 'Eigentümer mit Anteilen zuordnen', page: 'PortfolioManagement', icon: '👤' },
  { id: 'lease', label: 'Ersten Mietvertrag erstellen', page: 'Contracts', icon: '📑' },
  { id: 'bookings', label: '"Buchungen generieren" klicken', page: 'GeneratedBookings', icon: '📊' },
  { id: 'bank', label: 'Bankverbindung einrichten', page: 'BankAccounts', icon: '🏦' },
  { id: 'invoice', label: 'Erste Rechnung kategorisieren', page: 'Invoices', icon: '💰' },
];

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_checklist');
    if (saved) setCompleted(JSON.parse(saved));
  }, []);

  // Save to localStorage
  const toggleItem = (id) => {
    const updated = { ...completed, [id]: !completed[id] };
    setCompleted(updated);
    localStorage.setItem('onboarding_checklist', JSON.stringify(updated));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = (completedCount / CHECKLIST_ITEMS.length) * 100;
  const allDone = completedCount === CHECKLIST_ITEMS.length;

  if (allDone && collapsed) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">🚀 Onboarding-Checkliste</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium">{completedCount}/{CHECKLIST_ITEMS.length}</span>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-3">
          {CHECKLIST_ITEMS.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg transition-colors">
              <Checkbox
                id={item.id}
                checked={completed[item.id] || false}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <label htmlFor={item.id} className={`flex-1 cursor-pointer ${completed[item.id] ? 'line-through text-slate-500' : ''}`}>
                {item.icon} {item.label}
              </label>
              {!completed[item.id] && (
                <Link to={createPageUrl(item.page)}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Jetzt erledigen →
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
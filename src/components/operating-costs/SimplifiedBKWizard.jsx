import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BetriebskostenTooltip from '@/components/shared/BetriebskostenTooltip';

const STEPS = [
  { id: 1, label: 'Objekt & Zeitraum', description: 'Gebäude auswählen' },
  { id: 2, label: 'Automatische Kosten', description: 'Vorauswahl prüfen' },
  { id: 3, label: 'Prüfen & Korrigieren', description: 'Details überprüfen' },
  { id: 4, label: 'Vorschau & Erstellen', description: 'Finalisieren' },
];

export default function SimplifiedBKWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCosts, setSelectedCosts] = useState([]);
  const queryClient = useQueryClient();

  const createStatementMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OperatingCostStatement.create({
        building_id: building.id,
        start_date: startDate,
        end_date: endDate,
        costs: selectedCosts,
        status: 'draft'
      });
    },
    onSuccess: () => {
      toast.success('✅ Betriebskostenabrechnung erstellt!');
      queryClient.invalidateQueries({ queryKey: ['operating-costs'] });
      setStep(5);
    }
  });

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏠 Betriebskostenabrechnung (vereinfacht)</h1>
        <p className="text-slate-600 mt-1">Schritt {step} von {STEPS.length}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2 mb-4">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1">
                <div className={`text-xs text-center font-medium mb-1 ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s.label}
                </div>
                <div className={`h-1 rounded ${step > s.id ? 'bg-blue-600' : step === s.id ? 'bg-blue-400' : 'bg-slate-200'}`} />
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Schritt 1: Objekt & Zeitraum</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gebäude auswählen</label>
                <select 
                  value={building?.id || ''} 
                  onChange={(e) => {
                    const b = { id: e.target.value, name: e.target.options[e.target.selectedIndex].text };
                    setBuilding(b);
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="">Wählen Sie ein Gebäude...</option>
                  {/* Will be populated with real buildings */}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Von</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bis</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold flex-1">Schritt 2: Automatische Kostenvorauswahl</h2>
                <BetriebskostenTooltip />
              </div>
              <p className="text-sm text-slate-600">Die folgenden Kosten wurden automatisch erkannt (nur umlagefähige):</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {/* Will show pre-selected costs */}
                <div className="p-3 bg-slate-50 rounded border text-sm">
                  <p>Heizung: €500</p>
                  <p>Wasser: €150</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Schritt 3: Prüfen & Korrigieren</h2>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  ⚠️ Kosten fehlend? → Gehe zu <a href="#" className="underline font-medium">Rechnungen kategorisieren</a>
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Schritt 4: Vorschau & Erstellen</h2>
              <div className="p-4 bg-slate-50 rounded border">
                <p className="text-sm font-medium">Zusammenfassung:</p>
                <ul className="text-sm text-slate-600 mt-2 space-y-1">
                  <li>Gebäude: {building?.name}</li>
                  <li>Zeitraum: {startDate} bis {endDate}</li>
                  <li>Anzahl Kosten: {selectedCosts.length}</li>
                </ul>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold">✅ Fertig!</h2>
              <p className="text-slate-600">Ihre Betriebskostenabrechnung wurde erstellt.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {step < 5 && (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
          
          {step < 4 && (
            <Button 
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Weiter
            </Button>
          )}
          
          {step === 4 && (
            <Button 
              onClick={() => createStatementMutation.mutate()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              ✓ Abrechnung erstellen
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
          → Schließen
        </Button>
      )}
    </div>
  );
}
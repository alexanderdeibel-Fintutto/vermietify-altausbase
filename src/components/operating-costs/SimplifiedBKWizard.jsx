import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BetriebskostenTooltip from '@/components/shared/BetriebskostenTooltip';

const STEPS = [
  { id: 1, label: 'Gebäude & Zeitraum', description: 'Was wann?' },
  { id: 2, label: 'Kosten', description: 'Automatische Vorauswahl' },
  { id: 3, label: 'Prüfen', description: 'Überprüfen & Korrigieren' },
  { id: 4, label: 'Fertig', description: 'Generieren' },
];

export default function SimplifiedBKWizard() {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(null);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [selectedCosts, setSelectedCosts] = useState([]);
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building?.list?.() || []
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice?.list?.() || []
  });

  // Auto-select umlagefähige Kosten
  const autoSelectedCosts = React.useMemo(() => {
    if (!building || !period.start || !period.end) return [];
    return invoices.filter(inv => 
      inv.building_id === building.id &&
      inv.operating_cost_relevant &&
      inv.invoice_date >= period.start &&
      inv.invoice_date <= period.end
    );
  }, [building, period, invoices]);

  React.useEffect(() => {
    setSelectedCosts(autoSelectedCosts.map(c => c.id));
  }, [autoSelectedCosts]);

  const createStatementMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OperatingCostStatement?.create?.({
        building_id: building.id,
        period_start: period.start,
        period_end: period.end,
        invoice_ids: selectedCosts,
        status: 'draft'
      });
    },
    onSuccess: () => {
      toast.success('BK-Abrechnung erstellt!');
      queryClient.invalidateQueries({ queryKey: ['operating-costs'] });
      setStep(5);
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    }
  });

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏠 Betriebskostenabrechnung (vereinfacht)</h1>
        <p className="text-slate-600 mt-1">Schritt {step} von 4</p>
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
              <h2 className="text-xl font-bold">Gebäude & Zeitraum</h2>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Gebäude *</label>
                  <select 
                    value={building?.id || ''} 
                    onChange={(e) => setBuilding(buildings.find(b => b.id === e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Wählen...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Von *</label>
                    <input 
                      type="date" 
                      value={period.start}
                      onChange={(e) => setPeriod({...period, start: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bis *</label>
                    <input 
                      type="date" 
                      value={period.end}
                      onChange={(e) => setPeriod({...period, end: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Kostenauswahl</h2>
                <BetriebskostenTooltip />
              </div>
              <p className="text-sm text-slate-600">
                {autoSelectedCosts.length} umlagefähige Kosten gefunden - bitte überprüfen:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {autoSelectedCosts.length === 0 ? (
                  <p className="text-slate-500">Keine umlagefähigen Kosten gefunden. Prüfe die Kategorisierung deiner Rechnungen.</p>
                ) : (
                  autoSelectedCosts.map(cost => (
                    <label key={cost.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={selectedCosts.includes(cost.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCosts([...selectedCosts, cost.id]);
                          } else {
                            setSelectedCosts(selectedCosts.filter(id => id !== cost.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cost.description}</p>
                        <p className="text-xs text-slate-600">{cost.recipient} · €{cost.amount}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Prüfen & Bestätigen</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Gebäude:</strong> {building?.name}</p>
                <p className="text-sm"><strong>Zeitraum:</strong> {period.start} bis {period.end}</p>
                <p className="text-sm"><strong>Kosten:</strong> {selectedCosts.length} Positionen</p>
                <p className="text-sm"><strong>Summe:</strong> €{
                  autoSelectedCosts
                    .filter(c => selectedCosts.includes(c.id))
                    .reduce((sum, c) => sum + (c.amount || 0), 0)
                    .toFixed(2)
                }</p>
              </div>
              <p className="text-xs text-slate-600">Alles korrekt? Klicke unten auf "Generieren"</p>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold">✅ Fertig!</h2>
              <p className="text-slate-600">Betriebskostenabrechnung wurde erstellt.</p>
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
              disabled={
                (step === 1 && (!building || !period.start || !period.end)) ||
                (step === 2 && selectedCosts.length === 0)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Weiter
            </Button>
          )}
          
          {step === 4 && (
            <Button 
              onClick={() => createStatementMutation.mutate()}
              disabled={createStatementMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              ✓ Generieren
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
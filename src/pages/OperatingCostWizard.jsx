import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import OperatingCostWizardStep1 from '@/components/operating-costs/OperatingCostWizardStep1';
import OperatingCostWizardStep2 from '@/components/operating-costs/OperatingCostWizardStep2';
import OperatingCostWizardStep3 from '@/components/operating-costs/OperatingCostWizardStep3';
import OperatingCostWizardStep4 from '@/components/operating-costs/OperatingCostWizardStep4';

const STEPS = [
  { id: 1, label: 'Gebäude', description: 'Welches Gebäude?' },
  { id: 2, label: 'Verträge', description: 'Welche Mieter?' },
  { id: 3, label: 'Kostenarten', description: 'Welche Kosten?' },
  { id: 4, label: 'Kostenpositionen', description: 'Einzelne Kosten' },
];

export default function OperatingCostWizard() {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [costs, setCosts] = useState([]);
  const queryClient = useQueryClient();

  const createStatementMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OperatingCostStatement.create({
        building_id: building.id,
        contract_ids: contracts.map(c => c.id),
        cost_type_ids: costTypes,
        costs: costs,
        status: 'draft'
      });
    },
    onSuccess: () => {
      toast.success('Betriebskostenabrechnung erstellt!');
      queryClient.invalidateQueries({ queryKey: ['operating-costs'] });
      setStep(5); // Completion screen
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    }
  });

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏠 Betriebskostenabrechnung</h1>
        <p className="text-slate-600 mt-1">Schritt {step} von {STEPS.length}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2 mb-4">
            {STEPS.map((s, idx) => (
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

      {/* Content */}
      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <OperatingCostWizardStep1 
              onNext={(b) => { setBuilding(b); setStep(2); }} 
              selected={building}
            />
          )}
          
          {step === 2 && (
            <OperatingCostWizardStep2 
              buildingId={building?.id}
              onNext={(c) => { setContracts(c); setStep(3); }}
              selected={contracts}
            />
          )}
          
          {step === 3 && (
            <OperatingCostWizardStep3 
              onNext={(ct) => { setCostTypes(ct); setStep(4); }}
              selected={costTypes}
            />
          )}
          
          {step === 4 && (
            <OperatingCostWizardStep4 
              onNext={(c) => setCosts(c)}
              selected={costs}
            />
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

      {/* Navigation */}
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
                (step === 1 && !building) ||
                (step === 2 && contracts.length === 0) ||
                (step === 3 && costTypes.length === 0)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Weiter
            </Button>
          )}
          
          {step === 4 && (
            <Button 
              onClick={() => createStatementMutation.mutate()}
              disabled={costs.some(c => !c.category || !c.amount)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              isLoading={createStatementMutation.isPending}
            >
              ✓ Abrechnung erstellen
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          → Zur Abrechnung
        </Button>
      )}
    </div>
  );
}
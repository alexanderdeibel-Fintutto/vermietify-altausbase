import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetScenarioBuilder({ budgetId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedScenarioType, setSelectedScenarioType] = useState('realistic');
  const [formData, setFormData] = useState({
    scenario_name: '',
    description: '',
    assumptions: [],
    adjustments: {}
  });

  const { data: scenarios, isLoading, refetch } = useQuery({
    queryKey: ['budgetScenarios', budgetId],
    queryFn: async () => {
      try {
        return await base44.entities.BudgetScenario.filter(
          { rolling_budget_id: budgetId },
          '-created_at',
          50
        );
      } catch {
        return [];
      }
    }
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: async () => {
      try {
        const budgets = await base44.entities.RollingBudget.filter({ id: budgetId }, null, 1);
        return budgets[0];
      } catch {
        return null;
      }
    }
  });

  const handleCreateScenario = async () => {
    try {
      if (!formData.scenario_name) {
        toast.error('Szenarioname erforderlich');
        return;
      }

      const adjustments = {};
      budget?.categories.forEach(cat => {
        const input = document.getElementById(`adj-${cat.category_name}`);
        if (input) {
          adjustments[cat.category_name] = parseFloat(input.value) || 0;
        }
      });

      await base44.functions.invoke('generateBudgetScenario', {
        rolling_budget_id: budgetId,
        scenario_type: selectedScenarioType,
        scenario_name: formData.scenario_name,
        description: formData.description,
        adjustments,
        assumptions: formData.assumptions
      });

      toast.success('Szenario erstellt');
      setFormData({ scenario_name: '', description: '', assumptions: [], adjustments: {} });
      setShowDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const getScenarioIcon = (type) => {
    switch (type) {
      case 'optimistic':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'pessimistic':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Budget-Szenario erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Szenarioname</Label>
              <Input
                value={formData.scenario_name}
                onChange={(e) => setFormData({ ...formData, scenario_name: e.target.value })}
                placeholder="z.B. Pessimistisches Szenario Q2"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Szenariotyp</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['optimistic', 'realistic', 'pessimistic', 'custom'].map(type => (
                  <Button
                    key={type}
                    variant={selectedScenarioType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedScenarioType(type)}
                    className="text-xs"
                  >
                    {type === 'optimistic' ? '📈' : type === 'pessimistic' ? '📉' : type === 'realistic' ? '📊' : '⚙️'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Beschreibung</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreiben Sie das Szenario..."
                className="mt-1 min-h-20"
              />
            </div>

            {budget && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Kategorien-Anpassungen (%)</Label>
                {budget.categories.map(cat => (
                  <div key={cat.category_name} className="flex items-center gap-3">
                    <label className="text-xs w-32">{cat.category_name}</label>
                    <Input
                      id={`adj-${cat.category_name}`}
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="flex-1 text-sm"
                    />
                    <span className="text-xs text-slate-600 w-12">%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateScenario} className="flex-1 bg-blue-600">
                Szenario generieren
              </Button>
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowDialog(true)} className="bg-blue-600" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Neues Szenario
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : scenarios && scenarios.length > 0 ? (
        <div className="space-y-3">
          {scenarios.map(scenario => (
            <Card key={scenario.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getScenarioIcon(scenario.scenario_type)}
                    <div>
                      <p className="font-semibold">{scenario.scenario_name}</p>
                      <p className="text-xs text-slate-600">{scenario.description}</p>
                    </div>
                  </div>
                  <Badge className={
                    scenario.scenario_type === 'optimistic' ? 'bg-green-100 text-green-800' :
                    scenario.scenario_type === 'pessimistic' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {scenario.scenario_type}
                  </Badge>
                </div>

                {scenario.financial_impact && (
                  <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded p-3">
                    <div>
                      <p className="text-slate-600">Gesamtveränderung</p>
                      <p className={`font-semibold ${scenario.financial_impact.total_variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {scenario.financial_impact.total_variance > 0 ? '+' : ''}
                        {scenario.financial_impact.total_variance.toLocaleString('de-DE')} €
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Prozentual</p>
                      <p className="font-semibold">
                        {scenario.financial_impact.variance_percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Risiken</p>
                      <p className="font-semibold">{scenario.risk_factors?.length || 0}</p>
                    </div>
                  </div>
                )}

                {scenario.risk_factors && scenario.risk_factors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-slate-600">Risikofaktoren:</p>
                    {scenario.risk_factors.slice(0, 2).map((risk, idx) => (
                      <p key={idx} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                        • {risk}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-slate-600">Keine Szenarien erstellt</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
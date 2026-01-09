import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import RollingBudgetManager from '@/components/budget/RollingBudgetManager';
import BudgetScenarioBuilder from '@/components/budget/BudgetScenarioBuilder';
import ScenarioComparison from '@/components/budget/ScenarioComparison';
import RollingBudgetTimeline from '@/components/budget/RollingBudgetTimeline';
import BudgetVisualization from '@/components/budget/BudgetVisualization';

export default function BudgetPlanning() {
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [periodsGenerating, setPeriodsGenerating] = useState(false);

  const { data: selectedBudget, refetch: refetchBudget } = useQuery({
    queryKey: ['selectedBudget', selectedBudgetId],
    queryFn: async () => {
      if (!selectedBudgetId) return null;
      try {
        const budgets = await base44.entities.RollingBudget.filter(
          { id: selectedBudgetId },
          null,
          1
        );
        return budgets[0];
      } catch {
        return null;
      }
    },
    enabled: !!selectedBudgetId
  });

  const handleGeneratePeriods = async () => {
    if (!selectedBudgetId) return;
    try {
      setPeriodsGenerating(true);
      await base44.functions.invoke('generateRollingBudgetPeriods', {
        rolling_budget_id: selectedBudgetId,
        start_date: new Date().toISOString()
      });
      refetchBudget();
    } catch (error) {
      console.error('Error generating periods:', error);
    } finally {
      setPeriodsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light">Rollierende Budgetplanung</h1>
        <p className="text-slate-600 text-sm mt-1">
          Kontinuierliche Budgetierung mit Was-wäre-wenn-Szenarioanalysen
        </p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budgets">Rollierende Budgets</TabsTrigger>
          <TabsTrigger value="timeline" disabled={!selectedBudgetId}>Zeitstrahl</TabsTrigger>
          <TabsTrigger value="scenarios" disabled={!selectedBudgetId}>Szenarien</TabsTrigger>
          <TabsTrigger value="comparison" disabled={!selectedBudgetId}>Vergleich</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget-Verwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <RollingBudgetManager onBudgetSelect={setSelectedBudgetId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {selectedBudget ? (
            <div className="space-y-4">
              {!selectedBudget.periods || selectedBudget.periods.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center space-y-4">
                    <p className="text-slate-600">Keine Perioden generiert</p>
                    <Button 
                      onClick={handleGeneratePeriods}
                      disabled={periodsGenerating}
                      className="bg-blue-600"
                    >
                      {periodsGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        'Perioden generieren'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Button 
                    onClick={handleGeneratePeriods}
                    variant="outline"
                    size="sm"
                    disabled={periodsGenerating}
                  >
                    {periodsGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Neu generieren...
                      </>
                    ) : (
                      'Perioden aktualisieren'
                    )}
                  </Button>
                  <RollingBudgetTimeline budget={selectedBudget} />
                </>
              )}
            </div>
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">Wählen Sie ein Budget</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="mt-4">
          {selectedBudgetId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget-Szenarien</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetScenarioBuilder budgetId={selectedBudgetId} />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">
                  Wählen Sie ein Budget, um Szenarien zu erstellen
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          {selectedBudgetId ? (
            <ScenarioComparison budgetId={selectedBudgetId} />
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">
                  Wählen Sie ein Budget, um Szenarien zu vergleichen
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Was-wäre-wenn-Szenarioanalyse</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p>
            • <span className="font-semibold">Rollierende Budgets:</span> Passen Sie Budgets kontinuierlich für jeden Zeitraum an, nicht nur jährlich
          </p>
          <p>
            • <span className="font-semibold">Szenariotypen:</span> Optimistisch, Realistisch, Pessimistisch oder Benutzerdefiniert
          </p>
          <p>
            • <span className="font-semibold">Finanzielle Auswirkungen:</span> Visualisieren Sie sofort, wie Budgetänderungen die Prognosen beeinflussen
          </p>
          <p>
            • <span className="font-semibold">Risikobewertung:</span> Automatische Erkennung von Risikofaktoren basierend auf Szenarien
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
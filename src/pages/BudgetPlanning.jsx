import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RollingBudgetManager from '@/components/budget/RollingBudgetManager';
import BudgetScenarioBuilder from '@/components/budget/BudgetScenarioBuilder';

export default function BudgetPlanning() {
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light">Rollierende Budgetplanung</h1>
        <p className="text-slate-600 text-sm mt-1">
          Kontinuierliche Budgetierung mit Was-wäre-wenn-Szenarioanalysen
        </p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="budgets">Rollierende Budgets</TabsTrigger>
          <TabsTrigger value="scenarios" disabled={!selectedBudgetId}>Szenarien</TabsTrigger>
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
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PropertyBudgetPlanner({ companyId }) {
  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', companyId],
    queryFn: () => base44.asServiceRole.entities.PropertyBudget.filter({ company_id: companyId })
  });

  const calculateMutation = useMutation({
    mutationFn: (budgetId) =>
      base44.functions.invoke('calculateBudgetVariance', { budget_id: budgetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Budgetplanung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {budgets.map(budget => {
          const totalPlanned = Object.values(budget.planned_expenses || {}).reduce((a, b) => a + (b || 0), 0);
          const totalActual = Object.values(budget.actual_expenses || {}).reduce((a, b) => a + (b || 0), 0);
          const progress = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

          return (
            <div key={budget.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Jahr {budget.year}</span>
                <Badge variant={budget.variance >= 0 ? 'outline' : 'destructive'}>
                  {budget.variance ? `${budget.variance > 0 ? '+' : ''}${budget.variance}€` : 'N/A'}
                </Badge>
              </div>
              <div className="space-y-2 mb-2">
                <div className="flex justify-between text-xs">
                  <span>Einnahmen: {budget.actual_income || 0}€ / {budget.planned_income || 0}€</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Ausgaben: {Math.round(totalActual)}€ / {Math.round(totalPlanned)}€</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => calculateMutation.mutate(budget.id)}
                className="w-full gap-1"
              >
                <Calculator className="w-3 h-3" />
                Abweichung berechnen
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
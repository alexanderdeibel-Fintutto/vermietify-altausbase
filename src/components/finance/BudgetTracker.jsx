import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const riskColors = {
  low: { bg: 'bg-green-100', text: 'text-green-700', progress: 'bg-green-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', progress: 'bg-yellow-500' },
  high: { bg: 'bg-red-100', text: 'text-red-700', progress: 'bg-red-500' }
};

export default function BudgetTracker({ costCenters = [], transactions = [] }) {
  const budgetStatus = useMemo(() => {
    return costCenters.map(cc => {
      const ccTransactions = transactions.filter(t => 
        t.cost_center_id === cc.id && 
        t.transaction_type === 'expense'
      );

      const spent = ccTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const remaining = cc.budget_amount ? cc.budget_amount - spent : 0;
      const usage = cc.budget_amount ? (spent / cc.budget_amount) * 100 : 0;

      let riskLevel = 'low';
      if (usage >= 90) riskLevel = 'high';
      else if (usage >= 75) riskLevel = 'medium';

      return {
        ...cc,
        spent,
        remaining,
        usage: Math.round(usage),
        riskLevel
      };
    });
  }, [costCenters, transactions]);

  if (costCenters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Kostenstellen definiert</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {budgetStatus.map(budget => (
        <Card key={budget.id} className={`p-4 border-l-4 ${riskColors[budget.riskLevel].bg}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-light text-slate-900">{budget.code} - {budget.name}</h3>
              <p className="text-xs font-light text-slate-600 mt-0.5">{budget.description}</p>
            </div>
            <Badge className={riskColors[budget.riskLevel].text}>
              {budget.usage}% verbraucht
            </Badge>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs font-light text-slate-600 mb-1">
              <span>{budget.spent.toFixed(2)} € ausgegeben</span>
              <span>{budget.remaining.toFixed(2)} € verbleibend</span>
            </div>
            <Progress 
              value={Math.min(budget.usage, 100)} 
              className="h-2"
            />
            <p className="text-xs font-light text-slate-500 mt-1">
              von {budget.budget_amount.toFixed(2)} € Budget
            </p>
          </div>

          {budget.usage >= 90 && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs font-light text-red-700">
              ⚠️ Budget-Limit fast erreicht
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
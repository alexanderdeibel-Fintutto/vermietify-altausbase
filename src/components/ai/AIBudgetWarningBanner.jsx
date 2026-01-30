import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIBudgetWarningBanner() {
  const [budgetStatus, setBudgetStatus] = useState(null);

  useEffect(() => {
    checkBudget();
  }, []);

  async function checkBudget() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const logs = await base44.entities.AIUsageLog.filter({
        created_date: { $gte: startOfMonth.toISOString() }
      });
      
      const settingsList = await base44.entities.AISettings.list();
      const settings = settingsList?.[0];
      
      if (!settings) return;

      const totalCost = logs.reduce((sum, l) => sum + (l.cost_eur || 0), 0);
      const percent = Math.round((totalCost / settings.monthly_budget_eur) * 100);
      
      if (percent >= settings.budget_warning_threshold) {
        setBudgetStatus({
          percent,
          cost: totalCost,
          budget: settings.monthly_budget_eur,
          exceeded: percent >= 100,
          warning: percent >= settings.budget_warning_threshold && percent < 100
        });
      }
    } catch (e) {
      console.error('Failed to check budget:', e);
    }
  }

  if (!budgetStatus || (!budgetStatus.warning && !budgetStatus.exceeded)) return null;

  if (budgetStatus.exceeded) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Ban className="h-4 w-4" />
        <AlertDescription>
          <strong>KI-Budget überschritten!</strong> AI-Features wurden pausiert.
          Budget: €{budgetStatus.cost.toFixed(2)} / €{budgetStatus.budget.toFixed(2)} ({budgetStatus.percent}%)
          {' '}·{' '}
          <Link to={createPageUrl('AISettings')} className="underline">
            Einstellungen anpassen
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong>KI-Budget-Warnung:</strong> {budgetStatus.percent}% des monatlichen Budgets verwendet
        (€{budgetStatus.cost.toFixed(2)} / €{budgetStatus.budget.toFixed(2)})
        {' '}·{' '}
        <Link to={createPageUrl('AISettings')} className="underline">
          Einstellungen anpassen
        </Link>
      </AlertDescription>
    </Alert>
  );
}
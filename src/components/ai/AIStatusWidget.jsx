import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIStatusWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [logs, settingsList] = await Promise.all([
        base44.entities.AIUsageLog.filter({
          created_date: { $gte: startOfMonth.toISOString() }
        }),
        base44.entities.AISettings.list()
      ]);

      const settings = settingsList?.[0];
      const totalCost = logs.reduce((sum, l) => sum + (l.cost_eur || 0), 0);
      const totalSavings = logs.reduce((sum, l) => 
        sum + ((l.cost_without_cache_eur || 0) - (l.cost_eur || 0)), 0
      );

      return {
        requests: logs.length,
        cost: totalCost,
        budget: settings?.monthly_budget_eur || 50,
        budgetPercent: (totalCost / (settings?.monthly_budget_eur || 50)) * 100,
        savings: totalSavings,
        apiStatus: settings?.api_status || 'unknown',
        cachingEnabled: settings?.enable_prompt_caching
      };
    },
    refetchInterval: 60000 // Alle 60s aktualisieren
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Lade...</div>
        </CardContent>
      </Card>
    );
  }

  const budgetColor = stats.budgetPercent >= 100 
    ? 'text-red-600' 
    : stats.budgetPercent >= 80 
    ? 'text-orange-600' 
    : 'text-green-600';

  const apiStatusColors = {
    active: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    budget_exceeded: 'bg-red-100 text-red-800',
    rate_limited: 'bg-orange-100 text-orange-800',
    unknown: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            KI-Status
          </div>
          <Badge className={apiStatusColors[stats.apiStatus]}>
            {stats.apiStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{stats.requests}</div>
            <div className="text-xs text-muted-foreground">Anfragen</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${budgetColor}`}>
              {stats.budgetPercent.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Budget</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>€{stats.cost.toFixed(2)}</span>
            <span className="text-muted-foreground">von €{stats.budget}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${budgetColor.replace('text-', 'bg-')}`}
              style={{ width: `${Math.min(stats.budgetPercent, 100)}%` }}
            />
          </div>
        </div>

        {stats.savings > 0 && stats.cachingEnabled && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-green-700">
              €{stats.savings.toFixed(2)} durch Caching gespart
            </span>
          </div>
        )}

        {stats.budgetPercent >= 80 && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 rounded text-sm">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <span className="text-orange-700">
              Budget-Schwelle erreicht
            </span>
          </div>
        )}

        <Link to={createPageUrl('AISettings')}>
          <Button variant="outline" size="sm" className="w-full">
            Details anzeigen
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
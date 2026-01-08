import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, TrendingUp, AlertTriangle, CheckCircle,
  DollarSign, Target, Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function QuickInsights() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions-insights'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 100)
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items-insights'],
    queryFn: () => base44.entities.FinancialItem.list('-created_date', 100)
  });

  // Berechnungen
  const currentYear = new Date().getFullYear();
  const thisYearSubmissions = submissions.filter(s => s.tax_year === currentYear);
  const lastYearSubmissions = submissions.filter(s => s.tax_year === currentYear - 1);

  const thisYearIncome = financialItems
    .filter(i => i.type === 'income' && new Date(i.created_date).getFullYear() === currentYear)
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const lastYearIncome = financialItems
    .filter(i => i.type === 'income' && new Date(i.created_date).getFullYear() === currentYear - 1)
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const incomeGrowth = lastYearIncome > 0 
    ? ((thisYearIncome - lastYearIncome) / lastYearIncome) * 100 
    : 0;

  const avgConfidence = submissions.length > 0
    ? submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / submissions.length
    : 0;

  const needsAttention = submissions.filter(s => 
    s.validation_errors?.length > 0 || 
    (s.ai_confidence_score && s.ai_confidence_score < 70)
  ).length;

  const insights = [
    {
      id: 'income-growth',
      icon: TrendingUp,
      title: 'Einnahmen-Wachstum',
      value: `${incomeGrowth > 0 ? '+' : ''}${incomeGrowth.toFixed(1)}%`,
      description: 'Vergleich zum Vorjahr',
      color: incomeGrowth > 0 ? 'green' : incomeGrowth < 0 ? 'red' : 'slate',
      positive: incomeGrowth > 0
    },
    {
      id: 'ai-confidence',
      icon: Zap,
      title: 'Ø KI-Genauigkeit',
      value: `${avgConfidence.toFixed(0)}%`,
      description: 'Durchschnittliche Konfidenz',
      color: avgConfidence >= 80 ? 'green' : avgConfidence >= 60 ? 'yellow' : 'red',
      positive: avgConfidence >= 80
    },
    {
      id: 'needs-attention',
      icon: AlertTriangle,
      title: 'Benötigt Aufmerksamkeit',
      value: needsAttention,
      description: 'Einreichungen mit Problemen',
      color: needsAttention === 0 ? 'green' : needsAttention < 3 ? 'yellow' : 'red',
      positive: needsAttention === 0
    },
    {
      id: 'completion',
      icon: Target,
      title: 'Akzeptanzrate',
      value: `${submissions.length > 0 ? ((submissions.filter(s => s.status === 'ACCEPTED').length / submissions.length) * 100).toFixed(0) : 0}%`,
      description: 'Erfolgreiche Einreichungen',
      color: 'blue',
      positive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map(insight => {
        const Icon = insight.icon;
        return (
          <Card key={insight.id} className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${insight.color}-100 rounded-full -mr-12 -mt-12 opacity-20`} />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 bg-${insight.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${insight.color}-600`} />
                </div>
                {insight.positive && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              
              <div className="text-sm text-slate-600 mb-1">{insight.title}</div>
              <div className={`text-2xl font-bold text-${insight.color}-700 mb-1`}>
                {insight.value}
              </div>
              <div className="text-xs text-slate-500">{insight.description}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
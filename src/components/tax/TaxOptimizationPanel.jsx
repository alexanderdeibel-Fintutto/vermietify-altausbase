import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lightbulb, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxOptimizationPanel({ country, taxYear, canton }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: optimization, isLoading } = useQuery({
    queryKey: ['taxOptimization', country, taxYear, canton],
    queryFn: async () => {
      const functionName = country === 'AT' ? 'generateTaxOptimizationAT' : 'generateTaxOptimizationCH';
      const user = await base44.auth.me();
      const payload = { userId: user.id, taxYear };
      if (canton) payload.canton = canton;
      return await base44.functions.invoke(functionName, payload);
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">⏳ Wird optimiert...</div>;
  }

  if (!optimization?.recommendations || optimization.recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">✅ Keine Optimierungsmöglichkeiten gefunden</p>
        </CardContent>
      </Card>
    );
  }

  const priorityConfig = {
    high: { icon: '🔴', bg: 'bg-red-50', border: 'border-red-200' },
    medium: { icon: '🟡', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: '🟢', bg: 'bg-green-50', border: 'border-green-200' }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Steueroptimierung
        </h3>
        <Badge className="bg-blue-100 text-blue-800">
          💰 {optimization.summary.currency} {optimization.summary.estimatedSavings}
        </Badge>
      </div>

      {optimization.recommendations.map((rec) => {
        const config = priorityConfig[rec.priority];
        return (
          <Card key={rec.id} className={`${config.bg} ${config.border} border cursor-pointer transition-all`}>
            <div
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              className="p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{config.icon}</span>
                    <p className="font-bold">{rec.title}</p>
                  </div>
                  <p className="text-sm text-slate-600">{rec.description}</p>
                </div>
                {rec.savings > 0 && (
                  <div className="text-right ml-4">
                    <p className="text-sm text-slate-600">Ersparnisse</p>
                    <p className="text-lg font-bold text-green-600">
                      {optimization.summary.currency} {rec.savings.toFixed(0)}
                    </p>
                  </div>
                )}
              </div>

              {expandedId === rec.id && (
                <div className="mt-4 pt-4 border-t border-slate-300">
                  <div className="bg-white bg-opacity-50 p-3 rounded mb-3">
                    <p className="text-sm font-medium mb-2">💡 Empfohlene Aktion:</p>
                    <p className="text-sm text-slate-700">{rec.action}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.success('Zur Aufgabenliste hinzugefügt');
                    }}
                  >
                    ✅ Zur Aufgabenliste
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-slate-600">Geschätztes Sparpotential</p>
              <p className="text-2xl font-bold">
                {optimization.summary.currency} {optimization.summary.estimatedSavings}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
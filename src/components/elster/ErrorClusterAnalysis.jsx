import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ErrorClusterAnalysis() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('clusterValidationErrors', {
        year
      });

      if (response.data.success) {
        setInsights(response.data.insights);
        toast.success('Fehleranalyse abgeschlossen');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Fehler-Clustering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded flex-1"
          />
          <Button onClick={analyze} disabled={loading}>
            {loading ? 'Analysiere...' : 'Analysieren'}
          </Button>
        </div>

        {insights && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-slate-600">Submissions</div>
                <div className="font-bold">{insights.total_submissions}</div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <div className="text-slate-600">Mit Fehlern</div>
                <div className="font-bold">{insights.submissions_with_errors}</div>
              </div>
            </div>

            {insights.top_errors && insights.top_errors.length > 0 && (
              <div className="space-y-3">
                <div className="font-medium text-sm">Häufigste Fehler</div>
                {insights.top_errors.map((error, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{error.field}</span>
                      <span className="text-slate-600">{error.count}x ({error.percentage}%)</span>
                    </div>
                    <Progress value={error.percentage} />
                    <div className="text-xs text-slate-600">{error.message}</div>
                  </div>
                ))}
              </div>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Empfehlungen</div>
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                    {rec.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
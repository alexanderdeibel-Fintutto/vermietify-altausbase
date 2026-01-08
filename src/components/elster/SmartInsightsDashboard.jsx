import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartInsightsDashboard() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateSmartInsights', {
        year
      });

      if (response.data.success) {
        setInsights(response.data.insights);
        toast.success('Insights generiert');
      }
    } catch (error) {
      toast.error('Insights-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-32"
          />
          <Button onClick={generateInsights} disabled={loading}>
            {loading ? 'Analysiere...' : 'Generieren'}
          </Button>
        </div>

        {insights && (
          <div className="space-y-4 pt-4 border-t">
            {/* Übersicht */}
            {insights.overview && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded">
                  <div className="text-xs text-slate-600">Einnahmen</div>
                  <div className="font-bold">
                    €{insights.overview.total_einnahmen?.toLocaleString('de-DE')}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-600">Kostenquote</div>
                  <div className="font-bold">{insights.overview.kostenquote}%</div>
                </div>
              </div>
            )}

            {/* Empfehlungen */}
            {insights.recommendations?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Empfehlungen
                </div>
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                    <Badge className="mb-1">{rec.priority}</Badge>
                    <div>{rec.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnungen */}
            {insights.warnings?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Warnungen
                </div>
                {insights.warnings.map((warn, idx) => (
                  <div key={idx} className="p-2 bg-yellow-50 rounded text-xs">
                    {warn.message}
                  </div>
                ))}
              </div>
            )}

            {/* Chancen */}
            {insights.opportunities?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Chancen
                </div>
                {insights.opportunities.map((opp, idx) => (
                  <div key={idx} className="p-2 bg-green-50 rounded text-xs">
                    {opp.message}
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
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TrendsDashboard() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTrendReport', {});

      if (response.data.success) {
        setTrends(response.data.trends);
      }
    } catch (error) {
      toast.error('Trend-Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend-Analyse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!trends ? (
          <Button onClick={loadTrends} disabled={loading} className="w-full">
            {loading ? 'Lade...' : 'Trends analysieren'}
          </Button>
        ) : (
          <>
            <div className="space-y-3">
              {Object.entries(trends).map(([key, data]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="text-sm capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(data.trend)}
                    <span className="text-xs text-slate-600">{data.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={loadTrends} className="w-full">
              Aktualisieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
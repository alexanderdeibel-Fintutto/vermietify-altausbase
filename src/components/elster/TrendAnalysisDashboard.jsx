import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function TrendAnalysisDashboard() {
  const [years, setYears] = useState(5);
  const [analyzing, setAnalyzing] = useState(false);
  const [trends, setTrends] = useState(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeSubmissionTrends', {
        years
      });

      if (response.data.success) {
        setTrends(response.data.trends);
        toast.success('Trend-Analyse abgeschlossen');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trend-Analyse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div>
              <Label>Jahre</Label>
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value))}
                className="w-24"
                min={1}
                max={10}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? 'Analysiere...' : 'Analyse starten'}
              </Button>
            </div>
          </div>

          {trends && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-sm text-slate-600">
                {trends.summary?.total_submissions} Submissions über {trends.summary?.years_analyzed} Jahre
              </div>

              {/* KI-Vertrauen Trend */}
              <div>
                <div className="text-sm font-medium mb-2">KI-Vertrauen über Zeit</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends.confidence_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Fehlerrate Trend */}
              <div>
                <div className="text-sm font-medium mb-2">Fehlerrate über Zeit</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends.error_rate_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Jahres-Details */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Details nach Jahr</div>
                <div className="space-y-1">
                  {Object.entries(trends.by_year).map(([year, data]) => (
                    <div key={year} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                      <span className="font-medium">{year}</span>
                      <div className="flex gap-4">
                        <span>{data.count} Submissions</span>
                        <span className="text-green-600">{data.acceptance_rate}% Akzeptiert</span>
                        <span className="text-blue-600">{data.avg_confidence}% KI-Vertrauen</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
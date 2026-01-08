import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export default function CostStructureAnalyzer() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeCostStructure', {
        year
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        toast.success('Kostenanalyse abgeschlossen');
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
          <TrendingUp className="w-5 h-5" />
          Kostenstruktur-Analyse
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

        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">
                €{analysis.total_costs.toLocaleString('de-DE')}
              </div>
              <div className="text-sm text-slate-600">Gesamtkosten {year}</div>
              {analysis.yoy_change !== undefined && (
                <div className={`text-sm font-medium mt-1 ${analysis.yoy_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {analysis.yoy_change > 0 ? '+' : ''}{analysis.yoy_change}% vs. Vorjahr
                </div>
              )}
            </div>

            {analysis.categories && analysis.categories.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analysis.categories}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={(entry) => `${entry.percentage}%`}
                    >
                      {analysis.categories.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {analysis.categories.map((cat, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-medium">€{cat.amount.toLocaleString('de-DE')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {analysis.insights && analysis.insights.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Insights</div>
                {analysis.insights.map((insight, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                    {insight.message}
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
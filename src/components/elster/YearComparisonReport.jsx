import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function YearComparisonReport() {
  const [year1, setYear1] = useState(new Date().getFullYear() - 2);
  const [year2, setYear2] = useState(new Date().getFullYear() - 1);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateComparison = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateComparisonReport', {
        year1,
        year2
      });

      if (response.data.success) {
        setComparison(response.data.comparison);
        toast.success('Vergleichsbericht erstellt');
      }
    } catch (error) {
      toast.error('Vergleich fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Jahresvergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="number"
            value={year1}
            onChange={(e) => setYear1(parseInt(e.target.value))}
            className="px-3 py-2 border rounded flex-1"
          />
          <span className="py-2">vs</span>
          <input
            type="number"
            value={year2}
            onChange={(e) => setYear2(parseInt(e.target.value))}
            className="px-3 py-2 border rounded flex-1"
          />
          <Button onClick={generateComparison} disabled={loading}>
            {loading ? 'Lädt...' : 'Vergleichen'}
          </Button>
        </div>

        {comparison && (
          <div className="space-y-4 pt-4 border-t">
            {['einnahmen', 'ausgaben', 'nettoertrag'].map(metric => {
              const change = comparison.changes[metric];
              const isPositive = change.absolute > 0;
              const Icon = isPositive ? TrendingUp : TrendingDown;
              
              return (
                <div key={metric} className="p-3 bg-slate-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{metric}</span>
                    <Icon className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-slate-600">{year1}</div>
                      <div className="font-bold">€{comparison.year1.data[metric]?.toLocaleString('de-DE') || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">{year2}</div>
                      <div className="font-bold">€{comparison.year2.data[metric]?.toLocaleString('de-DE') || 0}</div>
                    </div>
                  </div>
                  <div className={`text-sm mt-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{change.percentage}% ({isPositive ? '+' : ''}€{change.absolute.toLocaleString('de-DE')})
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
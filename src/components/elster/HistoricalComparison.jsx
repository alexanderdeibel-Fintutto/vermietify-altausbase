import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History, TrendingUp, TrendingDown, Minus,
  BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HistoricalComparison({ buildingId }) {
  const [selectedYears, setSelectedYears] = useState([
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 3
  ]);

  const { data: submissions = [] } = useQuery({
    queryKey: ['historical-submissions', buildingId, selectedYears],
    queryFn: async () => {
      if (buildingId) {
        return base44.entities.ElsterSubmission.filter({
          building_id: buildingId,
          tax_year: { $in: selectedYears }
        });
      }
      return base44.entities.ElsterSubmission.filter({
        tax_year: { $in: selectedYears }
      });
    }
  });

  const prepareComparisonData = () => {
    return selectedYears.map(year => {
      const yearSubmissions = submissions.filter(s => s.tax_year === year);
      
      const income = yearSubmissions.reduce((sum, s) => 
        sum + (s.form_data?.einnahmen || 0), 0
      );
      const expenses = yearSubmissions.reduce((sum, s) => 
        sum + (s.form_data?.werbungskosten || 0), 0
      );

      return {
        year,
        Einnahmen: income,
        Ausgaben: expenses,
        Überschuss: income - expenses
      };
    }).sort((a, b) => a.year - b.year);
  };

  const calculateTrend = (data, key) => {
    if (data.length < 2) return null;
    
    const latest = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    const change = ((latest - previous) / previous) * 100;

    return {
      value: change,
      isPositive: change > 0,
      isNeutral: Math.abs(change) < 1
    };
  };

  const comparisonData = prepareComparisonData();
  const incomeTrend = calculateTrend(comparisonData, 'Einnahmen');
  const expensesTrend = calculateTrend(comparisonData, 'Ausgaben');
  const surplusTrend = calculateTrend(comparisonData, 'Überschuss');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historischer Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary */}
        <div className="grid grid-cols-3 gap-3">
          <TrendCard
            label="Einnahmen"
            trend={incomeTrend}
            icon={TrendingUp}
            color="green"
          />
          <TrendCard
            label="Ausgaben"
            trend={expensesTrend}
            icon={TrendingDown}
            color="red"
          />
          <TrendCard
            label="Überschuss"
            trend={surplusTrend}
            icon={BarChart3}
            color="blue"
          />
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Einnahmen" fill="#10b981" />
              <Bar dataKey="Ausgaben" fill="#ef4444" />
              <Bar dataKey="Überschuss" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Year-over-Year Details */}
        <div>
          <h3 className="font-semibold mb-3">Detailvergleich</h3>
          <div className="space-y-2">
            {comparisonData.map((yearData, idx) => {
              if (idx === 0) return null; // Skip first year (no comparison)
              
              const prevYear = comparisonData[idx - 1];
              const incomeChange = yearData.Einnahmen - prevYear.Einnahmen;
              const expenseChange = yearData.Ausgaben - prevYear.Ausgaben;

              return (
                <div key={yearData.year} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{yearData.year} vs {prevYear.year}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Einnahmen:</span>
                      <div className="flex items-center gap-1">
                        {incomeChange > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-green-600" />
                        ) : incomeChange < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-red-600" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400" />
                        )}
                        <span className={incomeChange > 0 ? 'text-green-600' : incomeChange < 0 ? 'text-red-600' : 'text-slate-600'}>
                          {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(0)} €
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ausgaben:</span>
                      <div className="flex items-center gap-1">
                        {expenseChange > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-red-600" />
                        ) : expenseChange < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400" />
                        )}
                        <span className={expenseChange > 0 ? 'text-red-600' : expenseChange < 0 ? 'text-green-600' : 'text-slate-600'}>
                          {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(0)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year Selection */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-2">Jahre auswählen:</div>
          <div className="flex gap-2 flex-wrap">
            {[2024, 2023, 2022, 2021, 2020].map(year => (
              <Button
                key={year}
                variant={selectedYears.includes(year) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (selectedYears.includes(year)) {
                    setSelectedYears(selectedYears.filter(y => y !== year));
                  } else {
                    setSelectedYears([...selectedYears, year].sort((a, b) => b - a));
                  }
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard({ label, trend, icon: Icon, color }) {
  if (!trend) {
    return (
      <div className="p-3 bg-slate-50 border rounded-lg">
        <div className="text-xs text-slate-600 mb-1">{label}</div>
        <div className="text-sm text-slate-500">Keine Daten</div>
      </div>
    );
  }

  const TrendIcon = trend.isPositive ? TrendingUp : trend.isNeutral ? Minus : TrendingDown;

  return (
    <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
      <div className={`text-xs text-${color}-600 mb-1`}>{label}</div>
      <div className="flex items-center gap-2">
        <TrendIcon className={`w-4 h-4 text-${color}-600`} />
        <span className={`text-lg font-bold text-${color}-700`}>
          {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
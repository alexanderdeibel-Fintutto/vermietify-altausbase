import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState as useStateCallback } from 'react';

export default function AutonomyMetrics() {
  const [calculating, setCalculating] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await base44.functions.invoke('calculateAutonomyRate', {});
      setMetrics(response.data.metrics);
      toast.success(`Autonomie-Rate: ${response.data.autonomy_rate}%`);
    } catch (error) {
      toast.error('Berechnung fehlgeschlagen');
    } finally {
      setCalculating(false);
    }
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autonomie-Metriken</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Button onClick={handleCalculate} disabled={calculating}>
            {calculating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird berechnet...
              </>
            ) : (
              'Metriken berechnen'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const autonomyData = [
    { name: 'Automatisiert', value: metrics.autonomy_rate },
    { name: 'Manuell', value: 100 - metrics.autonomy_rate }
  ];

  const COLORS = ['#22c55e', '#e5e7eb'];

  return (
    <div className="space-y-6">
      {/* Hauptmetrik */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600">
              {metrics.autonomy_rate}%
            </div>
            <p className="text-slate-600 mt-2">Autonomie-Rate</p>
            <p className="text-xs text-slate-500 mt-1">
              System arbeitet zu {metrics.autonomy_rate}% vollständig automatisiert
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detaillierte Metriken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Auto-Erstellte Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auto_created}</div>
            <p className="text-xs text-slate-600 mt-1">
              von {metrics.total_submissions} Einreichungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Auto-Kategorisierte Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auto_categories}</div>
            <p className="text-xs text-slate-600 mt-1">
              Finanzposition mit hohem Confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fehler-Recovery-Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.error_recovery_rate}%
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Identifizierte Probleme gelöst
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Autonomie-Verteilung */}
      <Card>
        <CardHeader>
          <CardTitle>Automatisierungs-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={autonomyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
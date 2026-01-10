import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Zap, TrendingDown, AlertTriangle, Lightbulb, 
  Activity, ThermometerSun, Award, RefreshCw 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { toast } from 'sonner';

export default function EnergyAnalysisDashboard({ buildingId }) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const queryClient = useQueryClient();

  const { data: analyses = [] } = useQuery({
    queryKey: ['energy-analyses', buildingId],
    queryFn: () => base44.entities.EnergyAnalysis.filter({ 
      building_id: buildingId 
    }, '-created_date', 10),
    enabled: !!buildingId
  });

  const latestAnalysis = analyses[0];

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('analyzeEnergyConsumption', {
        building_id: buildingId,
        period: 'monthly',
        days: selectedPeriod
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['energy-analyses']);
      toast.success(`Analyse abgeschlossen: ${response.data.summary.anomalies_count} Anomalien gefunden`);
    }
  });

  const optimizeHeatingMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('optimizeHeatingControl', {
        building_id: buildingId
      });
    },
    onSuccess: (response) => {
      toast.success(`${response.data.optimizations_created} Optimierungen erstellt`);
    }
  });

  // Prepare chart data
  const consumptionTrendData = analyses.slice(0, 7).reverse().map((a, idx) => ({
    period: `Tag ${idx + 1}`,
    consumption: a.total_consumption,
    average: a.average_consumption
  }));

  const hourlyPatternData = latestAnalysis?.consumption_patterns?.peak_hours 
    ? [...Array(24)].map((_, hour) => ({
        hour: `${hour}:00`,
        usage: latestAnalysis.consumption_patterns.peak_hours.includes(hour) ? 'Hoch' :
               latestAnalysis.consumption_patterns.low_hours?.includes(hour) ? 'Niedrig' : 'Mittel',
        level: latestAnalysis.consumption_patterns.peak_hours.includes(hour) ? 3 :
               latestAnalysis.consumption_patterns.low_hours?.includes(hour) ? 1 : 2
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Energieanalyse</h2>
            <p className="text-slate-600">KI-gestützte Verbrauchsoptimierung</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Tage</SelectItem>
              <SelectItem value="30">30 Tage</SelectItem>
              <SelectItem value="90">90 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            Analysieren
          </Button>
          <Button
            variant="outline"
            onClick={() => optimizeHeatingMutation.mutate()}
            disabled={optimizeHeatingMutation.isPending}
          >
            <ThermometerSun className="w-4 h-4 mr-2" />
            Heizung optimieren
          </Button>
        </div>
      </div>

      {!latestAnalysis ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Noch keine Analyse vorhanden</p>
            <Button onClick={() => analyzeMutation.mutate()}>
              Erste Analyse starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {latestAnalysis.total_consumption?.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-600">kWh Gesamt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {latestAnalysis.savings_potential?.estimated_savings_euro?.toFixed(0)}€
                    </p>
                    <p className="text-xs text-slate-600">Einsparpotenzial</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {latestAnalysis.anomalies_detected?.length || 0}
                    </p>
                    <p className="text-xs text-slate-600">Anomalien</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {latestAnalysis.efficiency_score || 0}
                    </p>
                    <p className="text-xs text-slate-600">Effizienz-Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verbrauchstrend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={consumptionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="#3b82f633" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verbrauchsmuster nach Tageszeit</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hourlyPatternData.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="level" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                KI-Empfehlungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {latestAnalysis.ai_insights?.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          {latestAnalysis.anomalies_detected?.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="w-5 h-5" />
                  Erkannte Anomalien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {latestAnalysis.anomalies_detected.slice(0, 5).map((anomaly, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold">{anomaly.description}</p>
                        <p className="text-xs text-slate-600">
                          {new Date(anomaly.timestamp).toLocaleString('de-DE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          anomaly.severity === 'critical' ? 'bg-red-500' :
                          anomaly.severity === 'high' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }>
                          {anomaly.severity}
                        </Badge>
                        <p className="text-xs text-slate-600 mt-1">
                          {anomaly.value?.toFixed(1)} kWh
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
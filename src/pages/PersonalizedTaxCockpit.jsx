import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PersonalizedTaxCockpit() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const { data: compliance } = useQuery({
    queryKey: ['taxCompliance', taxYear],
    queryFn: async () => {
      const items = await base44.entities.TaxCompliance.filter({ tax_year: taxYear });
      return items;
    }
  });

  const { data: scenarios } = useQuery({
    queryKey: ['taxScenarios', taxYear],
    queryFn: async () => {
      const items = await base44.entities.TaxScenario.filter({ tax_year: taxYear });
      return items;
    }
  });

  const { data: reminders } = useQuery({
    queryKey: ['taxReminders', taxYear],
    queryFn: async () => {
      const items = await base44.entities.TaxReminder.filter({ tax_year: taxYear });
      return items;
    }
  });

  const validateQuality = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('validateDataQualityAndPlausibility', {
        tax_year: taxYear,
        country: profile?.primary_residence_country
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCompliance'] });
    }
  });

  const getOptimizations = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateTaxOptimizationSuggestions', {
        tax_year: taxYear,
        country: profile?.primary_residence_country
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxScenarios'] });
    }
  });

  const completedSteps = compliance?.filter(c => c.status === 'completed').length || 0;
  const totalSteps = compliance?.length || 5;
  const progressPercent = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Mein Steuerkockpit</h1>
        <p className="text-slate-500 font-light mt-2">Geführter Weg zur Steuererklärung ({taxYear})</p>
      </div>

      {/* Overall Progress */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Vorbereitung Steuererklärung</span>
            <span className="text-lg">{completedSteps}/{totalSteps}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs font-light text-slate-600">{Math.round(progressPercent)}% fertig</p>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Tabs defaultValue="next_actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="next_actions" className="text-xs">Nächste Schritte</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
          <TabsTrigger value="optimizations" className="text-xs">Optimierungen</TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs">Termine</TabsTrigger>
        </TabsList>

        {/* Next Actions */}
        <TabsContent value="next_actions" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Offene Aufgaben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {compliance?.filter(c => c.status !== 'completed').map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg flex gap-3 items-start">
                  <Clock className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-xs font-light">
                    <p className="font-medium text-slate-900">{item.requirement}</p>
                    <p className="text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Machen
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Status */}
        <TabsContent value="compliance" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Compliance Check</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => validateQuality.mutate()}
                disabled={validateQuality.isPending}
                className="text-xs"
              >
                {validateQuality.isPending ? 'Prüfe...' : 'Erneut prüfen'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {compliance?.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg flex gap-2 items-start">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-xs font-light">
                    <p className="font-medium">{item.requirement}</p>
                    <p className="text-slate-600">{item.completion_percentage}% fertig</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Optimizations */}
        <TabsContent value="optimizations" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Sparmöglichkeiten</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => getOptimizations.mutate()}
                disabled={getOptimizations.isPending}
                className="text-xs"
              >
                {getOptimizations.isPending ? 'Analysiere...' : 'Finden'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {scenarios?.sort((a, b) => (b.tax_savings || 0) - (a.tax_savings || 0)).slice(0, 5).map((s, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded-lg flex gap-3 items-start border border-green-200">
                  <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-xs font-light">
                    <p className="font-medium text-green-900">{s.scenario_name}</p>
                    <p className="text-green-800 mt-1">€{s.tax_savings?.toLocaleString()} Ersparnis</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders */}
        <TabsContent value="reminders" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wichtige Termine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders?.filter(r => r.status !== 'dismissed').map((r, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs font-light">
                  <div className="font-medium text-blue-900 mb-1">{r.title}</div>
                  <p className="text-blue-800">{r.message}</p>
                  <p className="text-blue-700 mt-2">Fällig: {r.scheduled_date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
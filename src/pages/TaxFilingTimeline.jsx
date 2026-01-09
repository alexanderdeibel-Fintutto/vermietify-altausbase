import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxFilingTimeline() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: timeline = {}, isLoading } = useQuery({
    queryKey: ['filingTimeline', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('createTaxFilingTimeline', {
        country,
        taxYear
      });
      return response.data?.timeline || {};
    }
  });

  const phases = timeline.phases?.phases || [];
  const progress = timeline.phases?.progress_percentage || 0;

  const getPhaseIcon = (phase) => {
    if (phase.status === 'completed') {
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    }
    if (phase.critical) {
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
    return <Clock className="w-6 h-6 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Steuererklärung Zeitplan</h1>
        <p className="text-slate-500 mt-1">Verfolgen Sie Ihren Einreichungsprozess</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Zeitplan wird erstellt...</div>
      ) : (
        <>
          {/* Progress Overview */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Gesamtfortschritt</CardTitle>
                <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between mt-4 text-xs text-slate-600">
                <span>Start</span>
                <span>Einreichung: {timeline.phases?.current_phase}</span>
                <span>Abschluss</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Geschätzter Zeitaufwand</p>
                <p className="text-2xl font-bold mt-2">
                  {Math.round(timeline.phases?.total_weeks || 0)} Wochen
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Erfasste Dokumente</p>
                <p className="text-2xl font-bold mt-2">{timeline.documents_collected || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Compliance-Punkte</p>
                <p className="text-2xl font-bold mt-2">{timeline.compliance_items || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Phases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📍 Zeitplan-Phasen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Keine Phasen verfügbar</p>
              ) : (
                phases.map((phase, index) => (
                  <div key={index} className="border-l-4 border-blue-300 pl-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{phase.phase}</h4>
                        {phase.start_week && phase.end_week && (
                          <p className="text-xs text-slate-600 mt-1">
                            Woche {phase.start_week} - {phase.end_week}
                          </p>
                        )}
                      </div>
                      {phase.critical && (
                        <Badge className="bg-red-100 text-red-800">Kritisch</Badge>
                      )}
                    </div>
                    {phase.tasks && phase.tasks.length > 0 && (
                      <div className="space-y-1">
                        {phase.tasks.map((task, i) => (
                          <div key={i} className="text-xs text-slate-600 flex gap-2">
                            <span>✓</span>
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          {timeline.phases?.milestones && timeline.phases.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Wichtige Meilensteine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeline.phases.milestones.map((milestone, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-slate-50 rounded border-l-2 border-blue-500"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{milestone}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
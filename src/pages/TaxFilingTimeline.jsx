import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [creating, setCreating] = useState(false);

  const { data: timeline = {}, isLoading } = useQuery({
    queryKey: ['taxFilingTimeline', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('createTaxFilingTimeline', {
        country,
        taxYear
      });
      return response.data?.timeline || {};
    },
    enabled: creating
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Steuererklär-Timeline</h1>
        <p className="text-slate-500 mt-1">Visualisieren Sie Ihren Erklärungsprozess</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={creating}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={creating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setCreating(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={creating}
          >
            Timeline erstellen
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Timeline wird erstellt...</div>
      ) : creating && timeline.content?.phases ? (
        <>
          {/* Overall Duration */}
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Gesamte Dauer</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {timeline.content.total_duration_days} Tage
                  </p>
                </div>
                <Clock className="w-12 h-12 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          {/* Critical Path */}
          {(timeline.content.critical_path || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  🔴 Kritischer Pfad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeline.content.critical_path.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-orange-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Phases Timeline */}
          <div className="space-y-4">
            {(timeline.content.phases || []).map((phase, i) => (
              <Card key={i} className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-slate-200"></div>
                <CardHeader className="pl-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">{phase.name}</CardTitle>
                      <p className="text-xs text-slate-600 mt-1">{phase.description}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {phase.duration_days} Tage
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-600 mt-3">
                    <span>📅 {phase.start_date}</span>
                    <span>→</span>
                    <span>{phase.end_date}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Milestones */}
                  {(phase.milestones || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">✓ Meilensteine:</p>
                      <ul className="space-y-1">
                        {phase.milestones.map((milestone, j) => (
                          <li key={j} className="text-xs p-1 bg-slate-50 rounded flex gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                            {milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {(phase.action_items || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">📋 Aktionen:</p>
                      <ul className="space-y-1">
                        {phase.action_items.map((action, j) => (
                          <li key={j} className="text-xs p-1 bg-blue-50 rounded">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dependencies */}
                  {(phase.dependencies || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">🔗 Abhängigkeiten:</p>
                      <ul className="space-y-1">
                        {phase.dependencies.map((dep, j) => (
                          <li key={j} className="text-xs p-1 bg-orange-50 rounded">
                            ⚠️ {dep}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Timeline erstellen", um Ihren Erklärungsprozess zu visualisieren
        </div>
      )}
    </div>
  );
}